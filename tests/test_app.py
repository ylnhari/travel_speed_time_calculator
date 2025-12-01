import pytest
import json
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index_route(client):
    """Test that the index page loads correctly."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Speed Benefit Calculator' in response.data

def test_calculate_api_valid(client):
    """Test the calculation API with valid data."""
    data = {
        'distance': 100,
        'original_speed': 80,
        'new_speed': 90
    }
    response = client.post('/api/calculate', 
                           data=json.dumps(data),
                           content_type='application/json')
    
    assert response.status_code == 200
    result = json.loads(response.data)
    
    # Expected values:
    # Original time: 100/80 = 1.25 hours
    # New time: 100/90 = 1.111... hours
    # Time saved: 1.25 - 1.111... = 0.1388... hours
    # Percentage: (0.1388... / 1.25) * 100 = 11.11... %
    
    assert result['original_time'] == 1.25
    assert abs(result['new_time'] - 1.1111) < 0.001
    assert abs(result['percentage_saved'] - 11.1111) < 0.001

def test_calculate_api_invalid_input(client):
    """Test the calculation API with invalid input (negative speed)."""
    data = {
        'distance': 100,
        'original_speed': -80,
        'new_speed': 90
    }
    response = client.post('/api/calculate', 
                           data=json.dumps(data),
                           content_type='application/json')
    assert response.status_code == 400

def test_calculate_api_missing_data(client):
    """Test the calculation API with missing data."""
    data = {
        'distance': 100,
        'original_speed': 80
        # Missing new_speed
    }
    response = client.post('/api/calculate', 
                           data=json.dumps(data),
                           content_type='application/json')
    assert response.status_code == 400

def test_calculate_api_speed_decrease(client):
    """Test that decreasing speed results in negative time saved."""
    data = {
        'distance': 100,
        'original_speed': 100,
        'new_speed': 50
    }
    response = client.post('/api/calculate', 
                           data=json.dumps(data),
                           content_type='application/json')
    
    assert response.status_code == 200
    result = json.loads(response.data)
    
    # Original: 1 hr. New: 2 hrs. Saved: -1 hr.
    assert result['original_time'] == 1.0
    assert result['new_time'] == 2.0
    assert result['time_saved'] == -1.0
    assert result['percentage_saved'] == -100.0

def test_calculate_api_zero_distance(client):
    """Test with zero distance."""
    data = {
        'distance': 0,
        'original_speed': 60,
        'new_speed': 120
    }
    response = client.post('/api/calculate', 
                           data=json.dumps(data),
                           content_type='application/json')
    
    assert response.status_code == 200
    result = json.loads(response.data)
    
    assert result['original_time'] == 0.0
    assert result['new_time'] == 0.0
    assert result['time_saved'] == 0.0
    assert result['percentage_saved'] == 0.0

def test_calculate_api_same_speed(client):
    """Test with same speed."""
    data = {
        'distance': 100,
        'original_speed': 100,
        'new_speed': 100
    }
    response = client.post('/api/calculate', 
                           data=json.dumps(data),
                           content_type='application/json')
    
    assert response.status_code == 200
    result = json.loads(response.data)
    
    assert result['time_saved'] == 0.0
    assert result['percentage_saved'] == 0.0
