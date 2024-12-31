from flask import send_file
from . import images_bp
from werkzeug.exceptions import NotFound

from database import get_db
from schemas import ImageSchema
from models import Image
from flask import send_file, make_response
from io import BytesIO
from werkzeug.exceptions import NotFound

image_schema = ImageSchema()

@images_bp.route("/<string:image_name>", methods=["GET"])
def get_image(image_name):
    db = get_db()
    image = db.execute(
        "SELECT image_blob FROM images WHERE name = ?", (image_name,)
    ).fetchone()
    if image is None:
        raise NotFound()

    # Convert the BLOB data into a BytesIO object
    image_blob = BytesIO(image["image_blob"])
    
    # Send the image blob as a file-like object
    response = make_response(send_file(image_blob, mimetype="image/jpeg"))
    response.headers["Content-Disposition"] = "inline; filename=image.jpeg"
    return response