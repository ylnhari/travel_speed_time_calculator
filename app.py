from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        distance = float(data['distance'])
        original_speed = float(data['original_speed'])
        new_speed = float(data['new_speed'])

        if original_speed <= 0 or new_speed <= 0 or distance < 0:
            return jsonify({'error': 'Invalid input values'}), 400

        original_time = distance / original_speed
        new_time = distance / new_speed
        time_saved = original_time - new_time
        
        if original_time > 0:
            percentage_saved = (time_saved / original_time) * 100
        else:
            percentage_saved = 0

        return jsonify({
            'original_time': original_time,
            'new_time': new_time,
            'time_saved': time_saved,
            'percentage_saved': percentage_saved
        })
    except (KeyError, ValueError, TypeError):
        return jsonify({'error': 'Invalid input data'}), 400

if __name__ == '__main__':
    app.run(debug=True)
