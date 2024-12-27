from dataclasses import dataclass
from typing import Optional

@dataclass
class Bot:
    id: int
    name: str
    description: Optional[str]
    default_system_prompt: Optional[str]
    system_prompt: Optional[str]
    model: Optional[str]
    orchestrator_bot: bool

    @staticmethod
    def from_row(row):
        return Bot(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            default_system_prompt=row['default_system_prompt'],
            system_prompt=row['system_prompt'],
            model=row['model'],
            orchestrator_bot=bool(row['orchestrator_bot'])
        )

@dataclass
class Checkpoint:
    id: int
    bot_id: int
    version: str
    created_at: str
    system_prompt: Optional[str]
    datasets: Optional[str]
    memories: Optional[str]
    session_history: Optional[str]
    model: Optional[str]

    @staticmethod
    def from_row(row):
        return Checkpoint(
            id=row['id'],
            bot_id=row['bot_id'],
            version=row['version'],
            created_at=row['created_at'],
            system_prompt=row['system_prompt'],
            datasets=row['datasets'],
            memories=row['memories'],
            session_history=row['session_history'],
            model=row['model']
        )

@dataclass
class Stack:
    id: int
    name: str
    description: Optional[str]
    orchestrator_bot_id: Optional[int]

    @staticmethod
    def from_row(row):
        return Stack(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            orchestrator_bot_id=row['orchestrator_bot_id']
        )

@dataclass
class StackSlot:
    id: int
    stack_id: int
    slot_number: int
    bot_id: Optional[int]

    @staticmethod
    def from_row(row):
        return StackSlot(
            id=row['id'],
            stack_id=row['stack_id'],
            slot_number=row['slot_number'],
            bot_id=row['bot_id']
        )

@dataclass
class Session:
    id: int
    bot_id: int
    started_at: str
    ended_at: Optional[str]
    messages: str

    @staticmethod
    def from_row(row):
        return Session(
            id=row['id'],
            bot_id=row['bot_id'],
            started_at=row['started_at'],
            ended_at=row['ended_at'],
            messages=row['messages']
        )
