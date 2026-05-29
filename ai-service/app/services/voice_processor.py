"""Voice transcription using faster-whisper. Model loaded once at startup."""
import tempfile
import os
from app.config import settings

_model = None


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )
    return _model


async def transcribe_audio(audio_bytes: bytes, audio_format: str = "webm") -> dict:
    """Transcribe audio bytes to text. Returns {transcript, language, confidence}."""
    model = _get_model()
    suffix = f".{audio_format}"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
        )
        transcript = " ".join(seg.text.strip() for seg in segments).strip()
        return {
            "transcript": transcript,
            "language": info.language,
            "confidence": round(info.language_probability, 3),
        }
    finally:
        os.unlink(tmp_path)
