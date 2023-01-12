# Import necessary modules
import mysql.connector
import json

# Connect to the database
cnx = mysql.connector.connect(user='root', password='mysql123!@#', host='localhost', database='displayad')
cursor = cnx.cursor()

# Execute the query
query = 'SELECT * FROM ads'
cursor.execute(query)

# Fetch the rows
ads = cursor.fetchall()

# Convert the rows to a list of dictionaries
results = []
for ad in ads:
    ad_dict = {
        'id': ad[0],
        'ad_start_time': ad[1],
        'ad_end_time': ad[2],
        'ad_name': ad[3],
        'ad_description': ad[4],
        'file_name': ad[5],
        'ad_type': ad[6],
    }
    results.append(ad_dict)

# Convert the list to JSON and print it
json_data = json.dumps(results)
print(json_data)

# Close the connection to the database
cursor.close()
cnx.close()

print('fetchded in tempaltes')
