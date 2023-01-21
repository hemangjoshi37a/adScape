from flask import Flask, request, redirect, url_for, render_template
import os
import mysql.connector
import jsonify
import json
import subprocess
from mysql_auth import *

# Set up the Flask app and the file upload destination folder
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploaded_files'

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Connect to the MySQL server
cnx = mysql.connector.connect(user=mysql_username,password=mysql_password, host=mysql_host)
cursor = cnx.cursor()

# Check if the database exists
cursor.execute("SHOW DATABASES LIKE 'displayad'")
result = cursor.fetchone()

if result is None:
  # The database does not exist, so create it
  cursor.execute("CREATE DATABASE displayad")

  # Grant all privileges to the root user on the new database
  cursor.execute("GRANT ALL PRIVILEGES ON displayad.* TO 'root'@'localhost'")

# Close the connection
cnx.close()
    
# Connect to the MySQL database
cnx = mysql.connector.connect(user=mysql_username,password=mysql_password, host=mysql_host, database='displayad')
cursor = cnx.cursor()

# Create the ads table
table_query = '''CREATE TABLE IF NOT EXISTS ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    ad_name VARCHAR(255) NOT NULL,
    ad_description TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    ad_type VARCHAR(255) NOT NULL
);'''
cursor.execute(table_query)
cnx.commit()

# Create the settings table
table_query = '''CREATE TABLE IF NOT EXISTS setting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parameter VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    UNIQUE (parameter)
);'''
cursor.execute(table_query)
cnx.commit()

cursor.close()
cnx.close()

# Set up a global variable to keep track of the subprocess
process = None

@app.route('/start_script')
def start_script():
    global process
    # Start the script in a new subprocess
    process = subprocess.Popen(['python', 'run_picture.py'])
    print('start_script')
    return 'Started script'


@app.route('/stop_script')
def stop_script():
    global process
    # Terminate the subprocess
    process.terminate()
    process = None
    print('stop_script')
    return 'Stopped script'

@app.route('/get_settings', methods=['GET'])
def get_settings():
    # Connect to the database
    connection = mysql.connector.connect(
        user=mysql_username,password=mysql_password, host=mysql_host,
        database='displayad'
    )
    cursor = connection.cursor()

    # Execute a SELECT statement to get all the rows from the setting table
    cursor.execute('SELECT * FROM setting')

    # Fetch the rows from the cursor
    rows = cursor.fetchall()
    cursor.close()
    cnx.close()

    # Convert the rows to a dictionary
    settings = {}
    for row in rows:
        settings[row[1]] = row[2]
        
    # Convert the dictionary to a JSON string and return it as the response
    return json.dumps(settings)



@app.route('/save_setting', methods=['POST'])
def save_setting():
    print('Saved Settings')
    # Get the data from the request payload
    settings = request.get_json()

    # Connect to the database
    connection = mysql.connector.connect(
        user=mysql_username,password=mysql_password, host=mysql_host,
        database='displayad'
    )
    cursor = connection.cursor()

    # Construct the INSERT ... ON DUPLICATE KEY UPDATE statement
    insert_statement = '''
    INSERT INTO setting (parameter, value) VALUES (%s, %s)
    ON DUPLICATE KEY UPDATE value = VALUES(value)
    '''

    # Execute the statement for each setting
    for parameter, value in settings.items():
        if(parameter!=''):
            cursor.execute(insert_statement, (parameter, value))

    # Commit the changes to the database
    connection.commit()
    cursor.close()
    connection.close()

    # Return a success response
    return '', 200

   

@app.route('/schedule')
def schedule():
    return render_template('schedule/index.html')

@app.route('/fetchdata.py')
def fetch_data():
    # Connect to the database
    cnx = mysql.connector.connect(user=mysql_username,password=mysql_password, host=mysql_host, database='displayad')
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
            'ad_start_time': ad[1].strftime("%Y-%m-%d %H:%M:%S"),
            'ad_end_time': ad[2].strftime("%Y-%m-%d %H:%M:%S"),
            'ad_name': ad[3],
            'ad_description': ad[4],
            'file_name': ad[5],
            'ad_type': ad[6],
        }
        results.append(ad_dict) 
    # Close the connection to the database
    cursor.close()
    cnx.close()
    
    # Convert the list to JSON and print it
    json_data = json.dumps(results)
    return json_data

@app.route('/delete-ad/<int:id>', methods=['DELETE'])
def delete_ad(id):
    # Connect to the database
    cnx = mysql.connector.connect(user=mysql_username,password=mysql_password, host=mysql_host, database='displayad')
    cursor = cnx.cursor()
    # Delete the ad with the specified id
    cursor.execute(f'DELETE FROM ads WHERE id={id}')
    cnx.commit()
    cursor.close()
    cnx.close()
    return fetch_data()

@app.route('/')
def home():
    # Render the home.html template
    return render_template('home.html')

@app.route('/setting')
def setting():
    # Render the home.html template
    
    with open('templates/setting/parameters.json') as f:
      parameters = json.load(f)

    return render_template('setting/setting.html', parameters=parameters)

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
#         print('upload_requested')
        # Get the form data
        start_time = request.form['start_time']
        end_time = request.form['end_time']
        ad_name = request.form['ad_name']
        ad_description = request.form['ad_description']

        # Get the file from the form
        file = request.files['ad_file']

        # Determine the type of advertisement based on the file extension
        file_extension = file.filename.split(".")[-1]
        if file_extension in ["txt", "pdf"]:
            ad_type = "text"
        elif file_extension in ["jpg", "png", "jpeg"]:
            ad_type = "picture"
        elif file_extension in ["mp4", "avi", "wmv",'m4v','mkv','webm']:
            ad_type = "video"
        else:
            # Invalid file type
            return redirect(url_for('schedule'))

        # Save the file to the UPLOAD_FOLDER
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], file.filename))
        cnx = mysql.connector.connect(user=mysql_username,password=mysql_password, host=mysql_host, database='displayad')
        cursor = cnx.cursor()
        # Insert the ad data into the MySQL database
        insert_query = "INSERT INTO ads (start_time, end_time, ad_name, ad_description, file_name, ad_type) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.execute(insert_query, (start_time, end_time, ad_name, ad_description, file.filename, ad_type))
        cnx.commit()

        # Redirect the user to the home page
#         print('upload_completed')
        return redirect(url_for('schedule'))
    else:
        # Render the upload/index.html template
#         print('rewnesder_upload')
        return render_template('upload/index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5004)