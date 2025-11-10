from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
from config import Config
from database import db, init_db
from models import Device, DeviceIO, Diagram, DiagramDevice, Connection

app = Flask(__name__, static_folder='../dist', static_url_path='/')
app.config.from_object(Config)
CORS(app)

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
init_db(app)

# Helper function to generate UUID
def generate_id():
    return str(uuid.uuid4())

# File upload helper
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ============= DEVICE ROUTES =============

@app.route('/api/devices', methods=['GET'])
def get_devices():
    devices = Device.query.order_by(Device.created_date.desc()).all()
    return jsonify([device.to_dict() for device in devices])

@app.route('/api/devices/<device_id>', methods=['GET'])
def get_device(device_id):
    device = Device.query.get_or_404(device_id)
    return jsonify(device.to_dict())

@app.route('/api/devices', methods=['POST'])
def create_device():
    data = request.json
    device = Device(
        id=generate_id(),
        brand=data['brand'],
        model=data['model'],
        category=data['category'],
        image_url=data.get('image_url'),
        description=data.get('description')
    )
    db.session.add(device)
    db.session.commit()
    return jsonify(device.to_dict()), 201

@app.route('/api/devices/<device_id>', methods=['PUT'])
def update_device(device_id):
    device = Device.query.get_or_404(device_id)
    data = request.json
    
    device.brand = data.get('brand', device.brand)
    device.model = data.get('model', device.model)
    device.category = data.get('category', device.category)
    device.image_url = data.get('image_url', device.image_url)
    device.description = data.get('description', device.description)
    
    db.session.commit()
    return jsonify(device.to_dict())

@app.route('/api/devices/<device_id>', methods=['DELETE'])
def delete_device(device_id):
    device = Device.query.get_or_404(device_id)
    db.session.delete(device)
    db.session.commit()
    return '', 204


# ============= DEVICE IO ROUTES =============

@app.route('/api/device-ios', methods=['GET'])
def get_device_ios():
    device_id = request.args.get('device_id')
    if device_id:
        ios = DeviceIO.query.filter_by(device_id=device_id).all()
    else:
        ios = DeviceIO.query.all()
    return jsonify([io.to_dict() for io in ios])

@app.route('/api/device-ios', methods=['POST'])
def create_device_io():
    data = request.json
    io = DeviceIO(
        id=generate_id(),
        device_id=data['device_id'],
        label=data['label'],
        connector_type=data['connector_type'],
        gender=data['gender'],
        direction=data['direction'],
        signal_type=data['signal_type']
    )
    db.session.add(io)
    db.session.commit()
    return jsonify(io.to_dict()), 201

@app.route('/api/device-ios/<io_id>', methods=['PUT'])
def update_device_io(io_id):
    io = DeviceIO.query.get_or_404(io_id)
    data = request.json
    
    io.label = data.get('label', io.label)
    io.connector_type = data.get('connector_type', io.connector_type)
    io.gender = data.get('gender', io.gender)
    io.direction = data.get('direction', io.direction)
    io.signal_type = data.get('signal_type', io.signal_type)
    
    db.session.commit()
    return jsonify(io.to_dict())

@app.route('/api/device-ios/<io_id>', methods=['DELETE'])
def delete_device_io(io_id):
    io = DeviceIO.query.get_or_404(io_id)
    db.session.delete(io)
    db.session.commit()
    return '', 204


# ============= DIAGRAM ROUTES =============

@app.route('/api/diagrams', methods=['GET'])
def get_diagrams():
    diagrams = Diagram.query.order_by(Diagram.updated_date.desc()).all()
    return jsonify([diagram.to_dict() for diagram in diagrams])

@app.route('/api/diagrams/<diagram_id>', methods=['GET'])
def get_diagram(diagram_id):
    diagram = Diagram.query.get_or_404(diagram_id)
    return jsonify(diagram.to_dict())

@app.route('/api/diagrams', methods=['POST'])
def create_diagram():
    data = request.json
    diagram = Diagram(
        id=generate_id(),
        name=data['name'],
        description=data.get('description'),
        client_name=data.get('client_name')
    )
    db.session.add(diagram)
    db.session.commit()
    return jsonify(diagram.to_dict()), 201

@app.route('/api/diagrams/<diagram_id>', methods=['PUT'])
def update_diagram(diagram_id):
    diagram = Diagram.query.get_or_404(diagram_id)
    data = request.json
    
    diagram.name = data.get('name', diagram.name)
    diagram.description = data.get('description', diagram.description)
    diagram.client_name = data.get('client_name', diagram.client_name)
    
    db.session.commit()
    return jsonify(diagram.to_dict())

@app.route('/api/diagrams/<diagram_id>', methods=['DELETE'])
def delete_diagram(diagram_id):
    diagram = Diagram.query.get_or_404(diagram_id)
    db.session.delete(diagram)
    db.session.commit()
    return '', 204


# ============= DIAGRAM DEVICE ROUTES =============

@app.route('/api/diagram-devices', methods=['GET'])
def get_diagram_devices():
    diagram_id = request.args.get('diagram_id')
    if diagram_id:
        devices = DiagramDevice.query.filter_by(diagram_id=diagram_id).all()
    else:
        devices = DiagramDevice.query.all()
    return jsonify([device.to_dict() for device in devices])

@app.route('/api/diagram-devices', methods=['POST'])
def create_diagram_device():
    data = request.json
    diagram_device = DiagramDevice(
        id=generate_id(),
        diagram_id=data['diagram_id'],
        device_id=data['device_id'],
        position_x=data['position_x'],
        position_y=data['position_y'],
        rotation=data.get('rotation', 0)
    )
    db.session.add(diagram_device)
    db.session.commit()
    return jsonify(diagram_device.to_dict()), 201

@app.route('/api/diagram-devices/<diagram_device_id>', methods=['PUT'])
def update_diagram_device(diagram_device_id):
    diagram_device = DiagramDevice.query.get_or_404(diagram_device_id)
    data = request.json
    
    diagram_device.position_x = data.get('position_x', diagram_device.position_x)
    diagram_device.position_y = data.get('position_y', diagram_device.position_y)
    diagram_device.rotation = data.get('rotation', diagram_device.rotation)
    
    db.session.commit()
    return jsonify(diagram_device.to_dict())

@app.route('/api/diagram-devices/<diagram_device_id>', methods=['DELETE'])
def delete_diagram_device(diagram_device_id):
    diagram_device = DiagramDevice.query.get_or_404(diagram_device_id)
    db.session.delete(diagram_device)
    db.session.commit()
    return '', 204


# ============= CONNECTION ROUTES =============

@app.route('/api/connections', methods=['GET'])
def get_connections():
    diagram_id = request.args.get('diagram_id')
    if diagram_id:
        connections = Connection.query.filter_by(diagram_id=diagram_id).all()
    else:
        connections = Connection.query.all()
    return jsonify([connection.to_dict() for connection in connections])

@app.route('/api/connections', methods=['POST'])
def create_connection():
    data = request.json
    connection = Connection(
        id=generate_id(),
        diagram_id=data['diagram_id'],
        source_diagram_device_id=data['source_diagram_device_id'],
        source_io_id=data['source_io_id'],
        target_diagram_device_id=data['target_diagram_device_id'],
        target_io_id=data['target_io_id'],
        cable_label=data.get('cable_label'),
        cable_length=data.get('cable_length'),
        notes=data.get('notes')
    )
    db.session.add(connection)
    db.session.commit()
    return jsonify(connection.to_dict()), 201

@app.route('/api/connections/<connection_id>', methods=['DELETE'])
def delete_connection(connection_id):
    connection = Connection.query.get_or_404(connection_id)
    db.session.delete(connection)
    db.session.commit()
    return '', 204


# ============= FILE UPLOAD ROUTE =============

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add unique prefix to avoid conflicts
        unique_filename = f"{generate_id()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Return URL to access the file
        file_url = f"/uploads/{unique_filename}"
        return jsonify({'file_url': file_url}), 201
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    app.run(debug=True, port=5000)