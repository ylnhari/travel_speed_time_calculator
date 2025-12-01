
document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultSection = document.getElementById('result-section');
    let speedChart = null;

    calculateBtn.addEventListener('click', async () => {
        const distanceInput = document.getElementById('distance');
        const originalSpeedInput = document.getElementById('original-speed');
        const newSpeedInput = document.getElementById('new-speed');

        // Clear previous errors
        document.querySelectorAll('.input-group').forEach(group => group.classList.remove('invalid'));
        const errors = [];
        if (!distanceInput.value) { errors.push({ input: distanceInput, message: 'Please enter distance' }); }
        if (!originalSpeedInput.value) { errors.push({ input: originalSpeedInput, message: 'Please enter original speed' }); }
        if (!newSpeedInput.value) { errors.push({ input: newSpeedInput, message: 'Please enter new speed' }); }
        // Validate numeric values
        if (distanceInput.value && isNaN(distanceInput.value)) { errors.push({ input: distanceInput, message: 'Distance must be a number' }); }
        if (originalSpeedInput.value && isNaN(originalSpeedInput.value)) { errors.push({ input: originalSpeedInput, message: 'Original speed must be a number' }); }
        if (newSpeedInput.value && isNaN(newSpeedInput.value)) { errors.push({ input: newSpeedInput, message: 'New speed must be a number' }); }
        if (errors.length) {
            errors.forEach(err => {
                const group = err.input.closest('.input-group');
                if (group) {
                    group.classList.add('invalid');
                    const msgSpan = group.querySelector('.error-message');
                    if (msgSpan) msgSpan.textContent = err.message;
                }
            });
            return;
        }
        const distance = distanceInput.value;
        const originalSpeed = originalSpeedInput.value;
        const newSpeed = newSpeedInput.value;

        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    distance: distance,
                    original_speed: originalSpeed,
                    new_speed: newSpeed
                }),
            });

            const data = await response.json();

            if (response.ok) {
                displayResults(data);
            } else {
                alert(data.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to calculate. Please try again.');
        }
    });

    function displayResults(data) {
        // Convert hours to minutes for better readability if less than 1 hour, or keep as hours/minutes
        const formatTime = (hours) => {
            const totalMinutes = Math.round(hours * 60);
            return `${totalMinutes} min`;
        };

        const timeSavedMin = Math.round(data.time_saved * 60);

        document.getElementById('time-saved').textContent = `${timeSavedMin} min`;
        document.getElementById('percentage-saved').textContent = `${data.percentage_saved.toFixed(1)}% `;
        document.getElementById('original-time').textContent = formatTime(data.original_time);
        document.getElementById('new-time').textContent = formatTime(data.new_time);

        const summaryText = document.getElementById('summary-text');
        if (timeSavedMin > 0) {
            summaryText.textContent = `By increasing your speed from ${document.getElementById('original-speed').value} km / h to ${document.getElementById('new-speed').value} km / h over ${document.getElementById('distance').value} km, you save ${timeSavedMin} minutes.`;
        } else {
            summaryText.textContent = "No time saved (or negative savings).";
        }

        resultSection.classList.remove('hidden');
        // Add class to trigger layout transition
        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.classList.add('results-active');
        }
        // Trigger reflow to enable transition
        void resultSection.offsetWidth;
        resultSection.classList.add('visible');

        drawChart(parseFloat(document.getElementById('distance').value), parseFloat(document.getElementById('original-speed').value), parseFloat(document.getElementById('new-speed').value));
    }

    function drawChart(distance, originalSpeed, newSpeed) {
        const ctx = document.getElementById('speedChart').getContext('2d');

        // Generate data points
        const labels = [];
        const dataPoints = [];
        const maxSpeed = Math.max(originalSpeed, newSpeed) * 1.5;
        const startSpeed = 10;

        for (let s = startSpeed; s <= maxSpeed; s += 5) {
            labels.push(s);
            const time = (distance / s) * 60; // time in minutes
            dataPoints.push(time);
        }

        if (speedChart) {
            speedChart.destroy();
        }

        speedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Travel Time (minutes)',
                    data: dataPoints,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Time vs.Speed(Distance: ${distance} km)`,
                        font: {
                            size: 16,
                            family: "'Outfit', sans-serif"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Time: ${context.parsed.y.toFixed(1)} min`;
                            },
                            title: function (context) {
                                return `Speed: ${context.label} km / h`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                xMin: originalSpeed,
                                xMax: originalSpeed,
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 2,
                                label: {
                                    content: 'Original',
                                    enabled: true
                                }
                            },
                            line2: {
                                type: 'line',
                                xMin: newSpeed,
                                xMax: newSpeed,
                                borderColor: 'rgb(16, 185, 129)',
                                borderWidth: 2,
                                label: {
                                    content: 'New',
                                    enabled: true
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Speed (km/h)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Time (minutes)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }
});
