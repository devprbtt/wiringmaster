from database import db
from datetime import datetime
import json

class Device(db.Model):
    __tablename__ = 'devices'
    
    id = db.Column(db.String(36), primary_key=True)
    brand = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(500))
    description = db.Column(db.Text)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ios = db.relationship('DeviceIO', backref__='device', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.brand,
            'model': self.model,
            'category': self.category,
            'image_url': self.image_url,
            'description': self.description,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None
        }


class DeviceIO(db.Model):
    __tablename__ = 'device_ios'
    
    id = db.Column(db.String(36), primary_key=True)
    device_id = db.Column(db.String(36), db.ForeignKey('devices.id'), nullable=False)
    label = db.Column(db.String(100), nullable=False)
    connector_type = db.Column(db.String(50), nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    direction = db.Column(db.String(20), nullable=False)
    signal_type = db.Column(db.String(20), nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'label': self.label,
            'connector_type': self.connector_type,
            'gender': self.gender,
            'direction': self.direction,
            'signal_type': self.signal_type,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None
        }


class Diagram(db.Model):
    __tablename__ = 'diagrams'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    client_name = db.Column(db.String(200))
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    diagram_devices = db.relationship('DiagramDevice', backref__='diagram', lazy=True, cascade='all, delete-orphan')
    connections = db.relationship('Connection', backref__='diagram', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'client_name': self.client_name,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None
        }


class DiagramDevice(db.Model):
    __tablename__ = 'diagram_devices'
    
    id = db.Column(db.String(36), primary_key=True)
    diagram_id = db.Column(db.String(36), db.ForeignKey('diagrams.id'), nullable=False)
    device_id = db.Column(db.String(36), db.ForeignKey('devices.id'), nullable=False)
    position_x = db.Column(db.Float, nullable=False)
    position_y = db.Column(db.Float, nullable=False)
    rotation = db.Column(db.Float, default=0)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'diagram_id': self.diagram_id,
            'device_id': self.device_id,
            'position_x': self.position_x,
            'position_y': self.position_y,
            'rotation': self.rotation,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None
        }


class Connection(db.Model):
    __tablename__ = 'connections'
    
    id = db.Column(db.String(36), primary_key=True)
    diagram_id = db.Column(db.String(36), db.ForeignKey('diagrams.id'), nullable=False)
    source_diagram_device_id = db.Column(db.String(36), db.ForeignKey('diagram_devices.id'), nullable=False)
    source_io_id = db.Column(db.String(36), db.ForeignKey('device_ios.id'), nullable=False)
    target_diagram_device_id = db.Column(db.String(36), db.ForeignKey('diagram_devices.id'), nullable=False)
    target_io_id = db.Column(db.String(36), db.ForeignKey('device_ios.id'), nullable=False)
    cable_label = db.Column(db.String(100))
    cable_length = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'diagram_id': self.diagram_id,
            'source_diagram_device_id': self.source_diagram_device_id,
            'source_io_id': self.source_io_id,
            'target_diagram_device_id': self.target_diagram_device_id,
            'target_io_id': self.target_io_id,
            'cable_label': self.cable_label,
            'cable_length': self.cable_length,
            'notes': self.notes,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None
        }