import json
import random
from datetime import datetime, timedelta

# Define farm boundaries (latitude, longitude)
fence_1 = [(49.9268967, 16.6038257), 
           (49.9253633, 16.6038149), 
           (49.9238369, 16.6038739), 
           (49.9240372, 16.6062504),
           (49.9239646, 16.6080582), 
           (49.9251907, 16.6079348), 
           (49.9255153, 16.6081279), 
           (49.9260851, 16.6080099),
           (49.9265375, 16.6055905)]
fence_2 = [(49.9267649, 16.6040152), 
           (49.9253522, 16.6040929), 
           (49.9239620, 16.6040740), 
           (49.9242168, 16.6062380),
           (49.9240958, 16.6078678), 
           (49.9252031, 16.6076569), 
           (49.9254811, 16.6078545), 
           (49.9259835, 16.6077801),
           (49.9263649, 16.6056687)]

# Point-in-polygon check using ray-casting algorithm
def is_point_in_polygon(point, polygon):
    x, y = point
    num_vertices = len(polygon)
    odd_intersections = False

    for i in range(num_vertices):
        x1, y1 = polygon[i]
        x2, y2 = polygon[(i + 1) % num_vertices]

        if ((y1 > y) != (y2 > y)) and (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1):
            odd_intersections = not odd_intersections

    return odd_intersections

def random_point_in_fence(fence):
    latitudes = [point[0] for point in fence]
    longitudes = [point[1] for point in fence]
    
    while True:
        latitude = random.uniform(min(latitudes), max(latitudes))
        longitude = random.uniform(min(longitudes), max(longitudes))
        if is_point_in_polygon((latitude, longitude), fence):
            return latitude, longitude

# Generate data for each hour over the last seven days
start_datetime = datetime.now() - timedelta(days=6)
end_datetime = datetime.now().replace(hour=23, minute=59, second=59) if datetime.now().day == 8 else datetime.now()

extra_data_day = start_datetime + timedelta(days=random.randint(0, 6))

# Pick a random day in the last seven days to have additional data points
extra_data_day = start_datetime + timedelta(days=random.randint(0, 6))

# Generate JSON data for 10 cows with hourly records
cows_data = []

for cow_id in range(1, 11):
    cow_records = []
    current_datetime = start_datetime
    # Start with initial values for each cow
    activity = 3  # Set default starting value for activity close to 3
    rumination = 0  # Start with 0 for cumulative rumination tracking

    # Initialize temperatures with a base value and apply a downward trend
    temp1_base = 20 + random.uniform(-1, 1)  # Starting temperature, slightly randomized
    temp2_base = 20 + random.uniform(-1, 1)
    pressure = 970 + random.uniform(-5, 5)

    while current_datetime <= end_datetime:
        # Set interval: every 15 minutes on November 8, 30 minutes if on the extra data day, otherwise every hour
        if current_datetime.date() == end_datetime.date():  # November 8
            time_increment = timedelta(minutes=10)
        elif current_datetime.date() == extra_data_day.date():
            time_increment = timedelta(minutes=15)
        else:
            time_increment = timedelta(minutes=30)
        
        # Select fence randomly with a preference for fence_1
        if random.random() < 0.7:
            latitude, longitude = random_point_in_fence(fence_1)
        else:
            latitude, longitude = random_point_in_fence(fence_2)

        # Generate activity with preference for 3, 0, and 1, less 4 and 5
        activity = random.choices([0, 1, 3, 4, 5], weights=[0.1, 0.15, 0.5, 0.1, 0.05])[0]

        # Manage rumination incrementally for continuous behavior tracking
        if rumination > 0:
            rumination += 1  # Increment rumination duration if active
            if random.random() < 0.2:  # 20% chance to stop rumination
                rumination = 0
        else:
            rumination = 1 if random.random() < 0.1 else 0  # 10% chance to start rumination

        # Apply gradual cooling trend to temperature over time
        temp1 = temp1_base + (current_datetime - start_datetime).days * -0.3 + random.uniform(-0.2, 0.2)
        temp2 = temp2_base + (current_datetime - start_datetime).days * -0.3 + random.uniform(-0.2, 0.2)

        # Gradual changes for pressure
        pressure += random.uniform(-1, 1)

        # Ensure values stay within realistic boundaries
        record = {
            "cow_id": cow_id,
            "longitude": longitude,
            "latitude": latitude,
            "activity": activity,
            "rumination": rumination,
            "temp1": round(temp1, 1),
            "temp2": round(temp2, 1),
            "pressure": round(pressure, 1),
            "datetime": current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        }
        cow_records.append(record)
        
        # Increment time
        current_datetime += time_increment
    
    cows_data.append({"id": cow_id, "records": cow_records})

# Save JSON data to file
filename = "cow_data.json"
with open(filename, 'w') as json_file:
    json.dump(cows_data, json_file, indent=4)

filename
