from server import create_app

# Change the host and port here
HOST = '0.0.0.0'
PORT = 8080

app = create_app('development') 
kwargs = {
            'host':HOST,
            'port':PORT,
         }

if __name__ == '__main__':
    app.run(**kwargs)
