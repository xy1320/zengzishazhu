import asyncio
import json
import os
import struct
import edge_tts

OUT_DIR = r"d:\gemini默认工作区\zengzi_collage_film\audio"
os.makedirs(OUT_DIR, exist_ok=True)

LINES = [
    {
        "id": "narrator_1",
        "speaker": "Narrator",
        "voice": "en-GB-RyanNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
        "text": "Once, in a quiet village, lived the wise scholar Zengzi, his wife, and their little boy."
    },
    {
        "id": "narrator_2",
        "speaker": "Narrator",
        "voice": "en-GB-RyanNeural",
        "rate": "+2%",
        "pitch": "+0Hz",
        "text": "One morning, his wife set off for market, and her little son trailed behind in tears."
    },
    {
        "id": "boy_1",
        "speaker": "Boy",
        "voice": "en-US-AnaNeural",
        "rate": "+4%",
        "pitch": "+6Hz",
        "text": "Wait for me! I wanna come too!"
    },
    {
        "id": "wife_1",
        "speaker": "Wife",
        "voice": "en-US-AvaMultilingualNeural",
        "rate": "+2%",
        "pitch": "+2Hz",
        "text": "Go on home, sweetheart! When I get back, we'll roast the pig just for you!"
    },
    {
        "id": "narrator_3",
        "speaker": "Narrator",
        "voice": "en-GB-RyanNeural",
        "rate": "+3%",
        "pitch": "+1Hz",
        "text": "Hearing that, the boy beamed, and skipped right home."
    },
    {
        "id": "narrator_4",
        "speaker": "Narrator",
        "voice": "en-GB-RyanNeural",
        "rate": "+2%",
        "pitch": "+0Hz",
        "text": "When she returned, she froze! There stood Zengzi, sharpening his blade beside the startled pig."
    },
    {
        "id": "wife_2",
        "speaker": "Wife",
        "voice": "en-US-AvaMultilingualNeural",
        "rate": "+6%",
        "pitch": "+6Hz",
        "text": "Wait, stop! What are you doing? I was only joking with him!"
    },
    {
        "id": "zengzi_1",
        "speaker": "Zengzi",
        "voice": "en-US-ChristopherNeural",
        "rate": "-5%",
        "pitch": "-2Hz",
        "text": "Never joke with a child. They learn everything by watching us. Deceive him today, and you teach him to deceive tomorrow."
    },
    {
        "id": "narrator_5",
        "speaker": "Narrator",
        "voice": "en-GB-RyanNeural",
        "rate": "-2%",
        "pitch": "-1Hz",
        "text": "And so, Zengzi kept the promise, teaching a lesson far richer than any feast: a parent's word is sacred."
    }
]


def get_mp3_duration_seconds(filepath):
    """Accurate MPEG frame-by-frame duration calculation without external libraries."""
    with open(filepath, "rb") as f:
        data = f.read()

    pos = 0
    # Skip ID3v2 tag if present
    if data[:3] == b"ID3" and len(data) >= 10:
        size = ((data[6] & 0x7F) << 21) | ((data[7] & 0x7F) << 14) | ((data[8] & 0x7F) << 7) | (data[9] & 0x7F)
        pos = 10 + size

    bitrates_v1_l3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
    bitrates_v2_l3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
    samplerates_v1 = [44100, 48000, 32000, 0]
    samplerates_v2 = [22050, 24000, 16000, 0]
    samplerates_v25 = [11025, 12000, 8000, 0]

    total_duration = 0.0
    n = len(data)
    while pos + 4 <= n:
        if data[pos] == 0xFF and (data[pos + 1] & 0xE0) == 0xE0:
            header = struct.unpack(">I", data[pos:pos + 4])[0]
            version_id = (header >> 19) & 0x3
            layer = (header >> 17) & 0x3
            bitrate_idx = (header >> 12) & 0xF
            sr_idx = (header >> 10) & 0x3
            padding = (header >> 9) & 0x1

            if version_id == 1 or layer != 1 or bitrate_idx in (0, 15) or sr_idx == 3:
                pos += 1
                continue

            if version_id == 3:  # MPEG 1
                bitrate = bitrates_v1_l3[bitrate_idx] * 1000
                sr = samplerates_v1[sr_idx]
                samples = 1152
                frame_len = int(144 * bitrate / sr) + padding
            else:  # MPEG 2 or 2.5
                bitrate = bitrates_v2_l3[bitrate_idx] * 1000
                sr = samplerates_v2[sr_idx] if version_id == 2 else samplerates_v25[sr_idx]
                samples = 576
                frame_len = int(72 * bitrate / sr) + padding

            if frame_len <= 0 or pos + frame_len > n:
                break
            total_duration += samples / sr
            pos += frame_len
        else:
            pos += 1
    return round(total_duration, 3)


async def generate_one(item):
    mp3_path = os.path.join(OUT_DIR, f"{item['id']}.mp3")
    communicate = edge_tts.Communicate(
        text=item["text"],
        voice=item["voice"],
        rate=item["rate"],
        pitch=item["pitch"],
        boundary="WordBoundary"
    )
    words = []
    with open(mp3_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "word": chunk["text"],
                    "start": round(chunk["offset"] / 10_000_000, 3),
                    "duration": round(chunk["duration"] / 10_000_000, 3)
                })
    dur = get_mp3_duration_seconds(mp3_path)
    # Fallback if frame parse returns 0
    if dur <= 0 and words:
        dur = round(words[-1]["start"] + words[-1]["duration"] + 0.25, 3)
    print(f"[OK] {item['id']:12s} ({item['speaker']:8s}) -> {dur:5.2f}s | {len(words)} words")
    return {
        "id": item["id"],
        "speaker": item["speaker"],
        "voice": item["voice"],
        "text": item["text"],
        "file": f"audio/{item['id']}.mp3",
        "duration": dur,
        "words": words
    }


async def main():
    results = []
    for item in LINES:
        res = await generate_one(item)
        results.append(res)

    total_speech = sum(r["duration"] for r in results)
    manifest = {
        "totalSpeechDuration": round(total_speech, 3),
        "clips": results
    }
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\nTotal pure speech duration: {total_speech:.2f}s")
    print(f"Manifest written to {manifest_path}")


if __name__ == "__main__":
    asyncio.run(main())
