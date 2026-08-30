import shutil
from pathlib import Path

import pytest

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads" / "shedding_photos"


@pytest.fixture(autouse=True)
def _clean_uploads():
    yield
    if UPLOADS_DIR.exists():
        shutil.rmtree(UPLOADS_DIR)


def test_create_and_list_shedding_log(gecko, client):
    res = client.post(f"/geckos/{gecko['id']}/shedding-logs", json={"date": "2026-08-01", "note": "蛻皮順利"})
    assert res.status_code == 201
    body = res.json()
    assert body["date"] == "2026-08-01"
    assert body["note"] == "蛻皮順利"
    assert body["photos"] == []

    res = client.get(f"/geckos/{gecko['id']}/shedding-logs")
    assert len(res.json()) == 1


def test_update_shedding_log_date_regression(gecko, client):
    created = client.post(f"/geckos/{gecko['id']}/shedding-logs", json={"date": "2026-08-01"}).json()
    res = client.patch(f"/shedding-logs/{created['id']}", json={"date": "2026-08-05"})
    assert res.status_code == 200
    assert res.json()["date"] == "2026-08-05"


def test_upload_and_delete_photos(gecko, client):
    log = client.post(f"/geckos/{gecko['id']}/shedding-logs", json={"date": "2026-08-01"}).json()

    res = client.post(
        f"/shedding-logs/{log['id']}/photos",
        files=[
            ("files", ("a.jpg", b"fake-jpg-bytes", "image/jpeg")),
            ("files", ("b.png", b"fake-png-bytes", "image/png")),
        ],
    )
    assert res.status_code == 201
    photos = res.json()
    assert len(photos) == 2
    assert all(p["file_path"].startswith("/uploads/shedding_photos/") for p in photos)

    res = client.get(f"/shedding-logs/{log['id']}")
    assert len(res.json()["photos"]) == 2

    res = client.delete(f"/shedding-photos/{photos[0]['id']}")
    assert res.status_code == 204

    res = client.get(f"/shedding-logs/{log['id']}")
    remaining = res.json()["photos"]
    assert len(remaining) == 1
    assert remaining[0]["id"] == photos[1]["id"]


def test_delete_shedding_log_cascades_to_photos(gecko, client, db_session):
    from app.models import SheddingPhoto

    log = client.post(f"/geckos/{gecko['id']}/shedding-logs", json={"date": "2026-08-01"}).json()
    photo = client.post(
        f"/shedding-logs/{log['id']}/photos",
        files=[("files", ("a.jpg", b"fake-jpg-bytes", "image/jpeg"))],
    ).json()[0]

    res = client.delete(f"/shedding-logs/{log['id']}")
    assert res.status_code == 204
    assert client.get(f"/shedding-logs/{log['id']}").status_code == 404
    assert client.get(f"/geckos/{gecko['id']}/shedding-logs").json() == []

    stored_photo = db_session.get(SheddingPhoto, photo["id"])
    assert stored_photo.is_deleted is True
