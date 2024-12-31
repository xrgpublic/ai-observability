from marshmallow import Schema, fields, validate

class BotSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    default_system_prompt = fields.Str(allow_none=True)
    system_prompt = fields.Str(allow_none=True)
    model = fields.Str(allow_none=True)
    orchestrator_bot = fields.Bool(required=True)

class CheckpointSchema(Schema):
    id = fields.Int(dump_only=True)
    bot_id = fields.Int(required=True)
    checkpoint_number = fields.Int(dump_only=True)
    version = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)
    system_prompt = fields.Str(allow_none=True)
    datasets = fields.Str(allow_none=True)
    memories = fields.Str(allow_none=True)
    session_history = fields.Str(allow_none=True)
    model = fields.Str(allow_none=True)
    name = fields.Str(dump_only=True)
    description = fields.Str(allow_none=True)

class StackSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    orchestrator_bot_id = fields.Int(allow_none=True)
    agents = fields.List(fields.Int(), dump_only=True)

class StackSlotSchema(Schema):
    id = fields.Int(dump_only=True)
    stack_id = fields.Int(required=True)
    slot_number = fields.Int(
        required=False,  # Made optional
        validate=validate.Range(min=1, max=5, error="Slot number must be between 1 and 5.")
    )
    bot_id = fields.Int(allow_none=True)

class SessionSchema(Schema):
    id = fields.Int(dump_only=True)
    bot_id = fields.Int(required=True)
    started_at = fields.Str(dump_only=True)
    ended_at = fields.Str(allow_none=True)
    messages = fields.Str()

class ImageSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    image_path = fields.Str(required=True)
    image_blob = fields.Raw(required=True)
    

