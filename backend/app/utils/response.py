from flask import jsonify


def success(data=None, message=None, status=200):
    """Standard success response."""
    resp = {'status': 'success'}
    if data is not None:
        resp['data'] = data
    if message:
        resp['message'] = message
    return jsonify(resp), status


def error(message, status=400, details=None):
    """Standard error response."""
    resp = {'status': 'error', 'message': message}
    if details:
        resp['details'] = details
    return jsonify(resp), status
