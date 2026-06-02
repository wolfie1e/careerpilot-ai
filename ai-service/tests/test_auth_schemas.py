import pytest
from pydantic import ValidationError

from app.schemas.auth import ChangePasswordRequest, UpdateProfileRequest


def test_update_profile_accepts_valid_username_and_avatar():
    payload = UpdateProfileRequest(
        username="wolfie1e",
        full_name="Wolfie One",
        avatar_url="https://example.com/avatar.png",
    )

    assert payload.username == "wolfie1e"
    assert payload.full_name == "Wolfie One"
    assert payload.avatar_url == "https://example.com/avatar.png"


def test_update_profile_rejects_invalid_username_characters():
    with pytest.raises(ValidationError):
        UpdateProfileRequest(username="bad username!")


def test_change_password_requires_minimum_lengths():
    with pytest.raises(ValidationError):
        ChangePasswordRequest(current_password="short", new_password="also")


def test_change_password_accepts_valid_payload():
    payload = ChangePasswordRequest(
        current_password="old-password-123",
        new_password="new-password-456",
    )

    assert payload.current_password == "old-password-123"
    assert payload.new_password == "new-password-456"
