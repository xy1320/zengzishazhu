import base64
import io
import json
import os
from PIL import Image

ROOT = r"d:\gemini默认工作区\zengzi_collage_film"
ASSETS_DIR = os.path.join(ROOT, "assets")
AUDIO_DIR = os.path.join(ROOT, "audio")
JS_DIR = os.path.join(ROOT, "js")
os.makedirs(JS_DIR, exist_ok=True)


def main():
    with open(os.path.join(ASSETS_DIR, "cutout_meta.json"), "r", encoding="utf-8") as f:
        cutout_meta = json.load(f)

    with open(os.path.join(AUDIO_DIR, "manifest.json"), "r", encoding="utf-8") as f:
        audio_manifest = json.load(f)

    images_b64 = {}
    total_img_bytes = 0
    for name, info in cutout_meta.items():
        png_path = os.path.join(ASSETS_DIR, f"{name}.png")
        im = Image.open(png_path).convert("RGBA")
        buf = io.BytesIO()
        im.save(buf, format="WEBP", quality=92, method=5)
        raw = buf.getvalue()
        total_img_bytes += len(raw)
        b64 = base64.b64encode(raw).decode("ascii")
        images_b64[name] = {
            "width": im.width,
            "height": im.height,
            "dataUri": f"data:image/webp;base64,{b64}"
        }
        print(f"[IMG] {name:16s} -> {len(raw)//1024:4d} KB (WebP RGBA)")

    # Exact Director's Cue Sheet (Total film duration: 55.50 seconds)
    cue_starts = {
        "narrator_1": 1.85,
        "narrator_2": 7.55,
        "boy_1":      12.75,
        "wife_1":     16.05,
        "narrator_3": 21.30,
        "narrator_4": 25.35,
        "wife_2":     32.10,
        "zengzi_1":   36.75,
        "narrator_5": 46.25,
    }

    audio_b64 = {}
    clips_out = []
    total_aud_bytes = 0
    for clip in audio_manifest["clips"]:
        cid = clip["id"]
        mp3_path = os.path.join(AUDIO_DIR, f"{cid}.mp3")
        with open(mp3_path, "rb") as f:
            raw = f.read()
        total_aud_bytes += len(raw)
        b64 = base64.b64encode(raw).decode("ascii")
        audio_b64[cid] = f"data:audio/mpeg;base64,{b64}"
        words = clip["words"]
        spoken_end = round(words[-1]["start"] + words[-1]["duration"], 3) if words else clip["duration"]
        clips_out.append({
            "id": cid,
            "speaker": clip["speaker"],
            "text": clip["text"],
            "cueStart": cue_starts[cid],
            "spokenEnd": round(cue_starts[cid] + spoken_end, 3),
            "duration": clip["duration"],
            "words": words
        })
        print(f"[AUD] {cid:12s} -> cue {cue_starts[cid]:5.2f}s .. {cue_starts[cid]+spoken_end:5.2f}s ({len(raw)//1024:3d} KB)")

    bundle = {
        "filmDuration": 55.50,
        "images": images_b64,
        "audio": audio_b64,
        "clips": clips_out
    }

    out_js = os.path.join(JS_DIR, "media_bundle.js")
    with open(out_js, "w", encoding="utf-8") as f:
        f.write("// Auto-generated offline-ready media bundle for The Promise & The Pig\n")
        f.write("window.ZENGZI_MEDIA = ")
        json.dump(bundle, f, separators=(",", ":"), ensure_ascii=False)
        f.write(";\n")

    print(f"\nBundle written to {out_js}")
    print(f"Images total: {total_img_bytes/1024:.1f} KB | Audio total: {total_aud_bytes/1024:.1f} KB | JS bundle: {os.path.getsize(out_js)/1024:.1f} KB")


if __name__ == "__main__":
    main()
