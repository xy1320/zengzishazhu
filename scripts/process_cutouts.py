import json
import math
import os
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

ART_DIR = r"C:\Users\15772\.gemini\antigravity\brain\6437d071-76ce-4983-9650-963153fd4b76"
OUT_DIR = r"d:\gemini默认工作区\zengzi_collage_film\assets"
os.makedirs(OUT_DIR, exist_ok=True)

SOURCES = {
    "zengzi_wise": ("zengzi_wise_1795241464729.jpg", 860, 10),
    "zengzi_cleaver": ("zengzi_cleaver_1795241465678.jpg", 860, 10),
    "wife_market": ("wife_market_v2_1795241489557.jpg", 820, 10),
    "wife_shocked": ("wife_shocked_1795241471269.jpg", 820, 10),
    "boy_crying": ("boy_crying_1795241471155.jpg", 680, 9),
    "boy_happy": ("boy_happy_1795241495997.jpg", 680, 9),
    "pig_happy": ("pig_happy_1795241503607.jpg", 640, 9),
    "pig_panicked": ("pig_panicked_1795241498539.jpg", 640, 9),
    "village_cottage": ("village_cottage_v2_1795241518407.jpg", 980, 8),
    "feast_table": ("feast_table_1795241501685.jpg", 860, 8),
}


def flood_fill_white_bg(rgb, thresh=240, sat_thresh=24, cut_large_interior_lower=False):
    """Flood fill exterior white background from borders while preserving interior whites (eyes, sleeves, rice)."""
    h, w, _ = rgb.shape
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    sat = maxc - minc
    lum = (r + g + b) // 3

    is_whiteish = (lum >= thresh) & (sat <= sat_thresh)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    # Seed all border pixels that are whiteish
    for x in range(w):
        if is_whiteish[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if is_whiteish[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if is_whiteish[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if is_whiteish[y, w - 1] and not visited[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_whiteish[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    if cut_large_interior_lower:
        # Cut out large enclosed pure-white gaps in lower 45% (e.g. under table stretchers)
        seen_int = np.zeros((h, w), dtype=bool)
        for sy in range(int(h * 0.55), h):
            for sx in range(w):
                if is_whiteish[sy, sx] and not visited[sy, sx] and not seen_int[sy, sx]:
                    comp = []
                    cq = deque([(sy, sx)])
                    seen_int[sy, sx] = True
                    while cq:
                        cy, cx = cq.popleft()
                        comp.append((cy, cx))
                        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                            if 0 <= ny < h and 0 <= nx < w and is_whiteish[ny, nx] and not visited[ny, nx] and not seen_int[ny, nx]:
                                seen_int[ny, nx] = True
                                cq.append((ny, nx))
                    if len(comp) >= 600:
                        for cy, cx in comp:
                            visited[cy, cx] = True

    fg_mask = ~visited
    return fg_mask


def make_paper_cutout(src_path, max_dim, border_px, seed=42, cut_lower_holes=False):
    img = Image.open(src_path).convert("RGB")
    # Resize first to working resolution so border thickness is consistent
    scale = min(max_dim / img.width, max_dim / img.height, 1.0)
    if scale < 1.0:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)

    rgb = np.array(img)
    fg = flood_fill_white_bg(rgb, thresh=238, sat_thresh=26, cut_large_interior_lower=cut_lower_holes)

    # Also catch tiny enclosed pure-white gaps ONLY if they are between legs/arms and huge? No—keep interior whites safe,
    # except let's inspect via contact sheet! For cottage fence gaps, flood fill from bottom already reaches them.
    # Remove tiny isolated dust specks in fg (< 25 px) via morphological opening/closing on mask
    fg_img = Image.fromarray((fg * 255).astype(np.uint8), mode="L")
    # Smooth jagged pixel staircase slightly
    fg_clean = fg_img.filter(ImageFilter.MedianFilter(size=3))

    # Build dilated deckled paper border mask
    # Dilate by border_px using MaxFilter iterations
    dilated = fg_clean
    steps = max(1, border_px // 2)
    for _ in range(steps):
        dilated = dilated.filter(ImageFilter.MaxFilter(size=5))
    dilated = dilated.filter(ImageFilter.GaussianBlur(radius=1.6))

    d_arr = np.array(dilated, dtype=np.float32) / 255.0
    h, w = d_arr.shape

    # Organic hand-cut scissor/deckled wobble modulation around the edge
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    rng = np.random.default_rng(seed)
    p1 = rng.uniform(0, 6.28)
    p2 = rng.uniform(0, 6.28)
    p3 = rng.uniform(0, 6.28)
    wobble = (
        0.10 * np.sin(xx * 0.08 + yy * 0.06 + p1)
        + 0.08 * np.sin(xx * 0.19 - yy * 0.14 + p2)
        + 0.06 * np.cos(xx * 0.31 + yy * 0.27 + p3)
    )
    paper_alpha = np.clip((d_arr + wobble - 0.36) * 5.2, 0.0, 1.0)

    # Create subtle handmade ivory cardstock texture for the paper border
    grain = rng.normal(0.0, 3.2, size=(h, w))
    # Slight fine horizontal/vertical paper fiber streaks
    fiber = np.sin(yy * 0.55 + rng.uniform(0, 6.28)) * 1.4 + np.cos(xx * 0.43 + rng.uniform(0, 6.28)) * 1.1
    paper_r = np.clip(250 + grain + fiber, 232, 255)
    paper_g = np.clip(244 + grain + fiber, 226, 252)
    paper_b = np.clip(230 + grain + fiber, 210, 244)

    # Subtle darkening right along outer cut edge for tactile paper thickness
    edge_band = np.clip((paper_alpha > 0.08) & (paper_alpha < 0.92), 0, 1).astype(np.float32)
    paper_r -= edge_band * 14
    paper_g -= edge_band * 15
    paper_b -= edge_band * 16

    # Soft blend of original painted artwork inside foreground mask over the textured ivory paper
    fg_soft = np.array(fg_clean.filter(ImageFilter.GaussianBlur(radius=0.8)), dtype=np.float32) / 255.0
    # Slightly tighten fg_soft so original pure white JPEG fringe dissolves cleanly into our warm ivory paper border!
    fg_weight = np.clip((fg_soft - 0.35) / 0.55, 0.0, 1.0)
    # Also where rgb is nearly pure white near the edge, let warm cardstock show through seamlessly
    r_f = rgb[:, :, 0].astype(np.float32)
    g_f = rgb[:, :, 1].astype(np.float32)
    b_f = rgb[:, :, 2].astype(np.float32)

    # Multiply subtle warm cream tint onto near-white paper regions of original illustration so it blends invisibly with cardstock
    out_r = paper_r * (1.0 - fg_weight) + np.minimum(r_f, paper_r) * fg_weight
    out_g = paper_g * (1.0 - fg_weight) + np.minimum(g_f, paper_g) * fg_weight
    out_b = paper_b * (1.0 - fg_weight) + np.minimum(b_f, paper_b) * fg_weight

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = np.clip(out_r, 0, 255).astype(np.uint8)
    rgba[:, :, 1] = np.clip(out_g, 0, 255).astype(np.uint8)
    rgba[:, :, 2] = np.clip(out_b, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(paper_alpha * 255.0, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(rgba, mode="RGBA")
    bbox = out_img.getbbox()
    if bbox:
        pad = 6
        x0 = max(0, bbox[0] - pad)
        y0 = max(0, bbox[1] - pad)
        x1 = min(w, bbox[2] + pad)
        y1 = min(h, bbox[3] + pad)
        out_img = out_img.crop((x0, y0, x1, y1))

    return out_img


def main():
    meta = {}
    processed = {}
    for idx, (name, (fname, max_dim, border_px)) in enumerate(SOURCES.items()):
        src_path = os.path.join(ART_DIR, fname)
        out_path = os.path.join(OUT_DIR, f"{name}.png")
        cutout = make_paper_cutout(
            src_path, max_dim, border_px, seed=101 + idx * 17,
            cut_lower_holes=(name == "feast_table")
        )
        cutout.save(out_path, optimize=True)
        meta[name] = {"file": f"assets/{name}.png", "width": cutout.width, "height": cutout.height}
        processed[name] = cutout
        print(f"[OK] {name:16s} -> {cutout.width}x{cutout.height} ({os.path.getsize(out_path)//1024} KB)")

    with open(os.path.join(OUT_DIR, "cutout_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    # Create a visual verification contact sheet over dark slate-ochre background to verify cutout borders!
    cols, rows = 5, 2
    cell_w, cell_h = 340, 340
    sheet = Image.new("RGBA", (cols * cell_w, rows * cell_h), (46, 62, 78, 255))
    for i, (name, im) in enumerate(processed.items()):
        r_idx, c_idx = divmod(i, cols)
        copy = im.copy()
        copy.thumbnail((cell_w - 30, cell_h - 30), Image.Resampling.LANCZOS)
        px = c_idx * cell_w + (cell_w - copy.width) // 2
        py = r_idx * cell_h + (cell_h - copy.height) // 2
        sheet.alpha_composite(copy, (px, py))

    sheet_path = os.path.join(OUT_DIR, "_verify_contact_sheet.png")
    sheet.convert("RGB").save(sheet_path)
    print(f"Verification sheet saved to {sheet_path}")


if __name__ == "__main__":
    main()
