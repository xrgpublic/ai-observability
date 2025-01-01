from flask import Blueprint

bots_bp = Blueprint('bots', __name__)
checkpoints_bp = Blueprint('checkpoints', __name__)
stacks_bp = Blueprint('stacks', __name__)
metrics_bp = Blueprint('metrics', __name__)
sessions_bp = Blueprint('sessions', __name__)
images_bp = Blueprint('images', __name__)
python_ide_bp = Blueprint('python_ide', __name__)

from . import bots
from . import checkpoints
from . import stacks
from . import metrics
from . import sessions
from . import images
from . import python_ide
