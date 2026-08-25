"""自動產生 docs/database/schema.md：資料表定義 + ER 圖（Mermaid）。

用法（於 backend/ 目錄下執行）：
    python -m scripts.generate_schema_doc

時機：每次新增/修改 app/models.py 並執行 alembic migration 後，重新執行本腳本，
讓 docs/database/schema.md 與實際 DB schema 保持同步。
"""
from __future__ import annotations

import subprocess
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Enum as SAEnum
from sqlalchemy.schema import UniqueConstraint

from app import models  # noqa: F401  匯入以註冊所有 model 到 Base.metadata
from app.database import Base

BACKEND_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = BACKEND_DIR.parent / "docs" / "database" / "schema.md"

TABLE_COMMENTS = {
    "daily_logs": "進食＋排便＋體重，維持「一天一筆」組合方式，不拆表。",
}


def _current_alembic_revision() -> str:
    try:
        result = subprocess.run(
            ["alembic", "current"],
            cwd=BACKEND_DIR,
            capture_output=True,
            text=True,
            check=True,
        )
        output = result.stdout.strip()
        return output.splitlines()[-1].split(" ")[0] if output else "(no migration applied)"
    except Exception:
        return "unknown（無法連線資料庫或 alembic 未安裝）"


def _column_type(col) -> str:
    if isinstance(col.type, SAEnum):
        values = ", ".join(repr(v) for v in col.type.enums)
        return f"enum({values})"
    return str(col.type)


def _column_flags(col) -> list[str]:
    flags: list[str] = []
    if col.primary_key:
        flags.append("PK")
    for fk in col.foreign_keys:
        flags.append(f"FK → {fk.column.table.name}.{fk.column.name}")
    if col.unique:
        flags.append("unique")
    if not col.nullable and not col.primary_key:
        flags.append("not null")
    if col.default is not None:
        arg = col.default.arg
        if callable(arg):
            flags.append(f"default={getattr(arg, '__name__', 'callable')}()")
        else:
            flags.append(f"default={arg!r}")
    if col.server_default is not None:
        flags.append("server_default")
    if col.onupdate is not None:
        flags.append("auto-update on write")
    return flags


def _table_markdown(table) -> str:
    lines = [f"### `{table.name}`"]
    comment = TABLE_COMMENTS.get(table.name)
    if comment:
        lines.append(f"\n{comment}")
    lines.append("\n| 欄位 | 型別 | 限制 |")
    lines.append("|---|---|---|")
    for col in table.columns:
        flags = ", ".join(_column_flags(col)) or "—"
        lines.append(f"| {col.name} | {_column_type(col)} | {flags} |")

    multi_col_uniques = [
        c for c in table.constraints if isinstance(c, UniqueConstraint) and len(c.columns) > 1
    ]
    for uc in multi_col_uniques:
        cols = ", ".join(c.name for c in uc.columns)
        lines.append(f"\nUNIQUE({cols})")

    for idx in table.indexes:
        if not idx.unique:
            continue
        cols = ", ".join(c.name for c in idx.columns)
        where = idx.dialect_kwargs.get("postgresql_where")
        if where is not None:
            lines.append(f"\nUNIQUE({cols}) WHERE {where}（partial index：`{idx.name}`）")
        else:
            lines.append(f"\nUNIQUE({cols})（index：`{idx.name}`）")

    return "\n".join(lines)


def _relationships() -> list[tuple[str, str, str]]:
    """回傳 (parent_table, child_table, fk_column) 清單，代表 1 parent - N child。"""
    rels = []
    for table in Base.metadata.sorted_tables:
        for col in table.columns:
            for fk in col.foreign_keys:
                rels.append((fk.column.table.name, table.name, col.name))
    return rels


def _mermaid_er() -> str:
    lines = ["```mermaid", "erDiagram"]
    for parent, child, label in _relationships():
        lines.append(f'    {parent} ||--o{{ {child} : "{label}"')
    lines.append("```")
    return "\n".join(lines)


def generate() -> str:
    revision = _current_alembic_revision()
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    parts = [
        "# 資料庫 Schema",
        "",
        "> **本檔案由 `backend/scripts/generate_schema_doc.py` 自動產生，請勿手動編輯。**",
        "> 來源：[`backend/app/models.py`](../../backend/app/models.py)。",
        "> 每次異動 model 並執行 `alembic upgrade head` 後，於 `backend/` 目錄執行：",
        ">",
        "> ```bash",
        "> python -m scripts.generate_schema_doc",
        "> ```",
        "",
        f"- 產生時間：{generated_at}",
        f"- Alembic revision：`{revision}`",
        "",
        "## ER 圖",
        "",
        _mermaid_er(),
        "",
        "## 資料表定義",
        "",
    ]

    for table in Base.metadata.sorted_tables:
        parts.append(_table_markdown(table))
        parts.append("")

    return "\n".join(parts).rstrip() + "\n"


def main() -> None:
    content = generate()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(content, encoding="utf-8")
    print(f"已寫入 {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
