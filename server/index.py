from app import create_app

# Create Flask application
app = create_app()

# This is important for Vercel deployment
# Vercel looks for the 'app' variable as the WSGI application
# Don't modify this variable name
app = app

if __name__ == "__main__":
    # This block only runs when executing the file directly
    # It won't run on Vercel's serverless environment
    app.run(debug=True)
