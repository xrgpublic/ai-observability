# AI Observability App Extension with Modular Intelligence Library

The **AI Observability App** is an extension for managing and visualizing your AI agents and stacks created with the `modular-intelligence` Python library. This app provides an intuitive interface to:
- View all agents you have created.
- Manage stacks of agents and organize them into logical groupings.
- Monitor session checkpoints for agents.

## Features
- **Agent Search**: Quickly find any agent you have created.
- **Stack Management**: Organize agents into reusable stacks for different workflows.
- **Session Tracking**: View and manage agent checkpoints for monitoring progress and activity.

## Installation
Follow these steps to set up the AI Observability App on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/xrgpublic/ai-observability.git
cd ai_observability
```

### 2. Run the Application with Docker Compose
Make sure you have Docker and Docker Compose installed. Then, run the following command:
```bash
docker-compose up
```

This will start the app and its necessary services.

### 3. Access the Application
- Frontend: Open your browser and navigate to:
```
http://localhost:5173
```

- Backend: The backend server will be available at:
```
http://localhost:5000
```

## Usage
- Use the **Search** panel to find individual agents or stacks.
- Navigate through stacks to see their respective agents.
- Checkpoints provide a history of agent interactions and session progress.

## API Usage
The API is still in development, but the following endpoints are available for testing:

- **Get all bots**:
  ```bash
  GET /api/v1/bots
  ```
  [Example Response](http://localhost:5000/api/v1/bots) :
  ```json
  [
    {
        "default_system_prompt": "You are a math tutor helping students understand mathematical concepts.",
        "description": "An AI that helps with math problems.",
        "id": 1,
        "model": "llama3.2",
        "name": "MathTutor",
        "orchestrator_bot": false,
        "system_prompt": "You are a math tutor helping students understand mathematical concepts."
    },
    {
        "default_system_prompt": "You are an English tutor assisting students with grammar and composition.",
        "description": "An AI that helps with English grammar and writing.",
        "id": 2,
        "model": "llama3.2",
        "name": "EnglishTutor",
        "orchestrator_bot": false,
        "system_prompt": "You are an English tutor assisting students with grammar and composition."
    }
  ]
  ```

- **Get information on a specific bot**:
  ```bash
  GET /api/v1/bots/<int:bot_id>
  ```
  Replace `<int:bot_id>` with the ID of the bot you want to query. [Example Response](http://localhost:5000/api/v1/bots/1) :
  ```json
  {
    "id": 1,
    "default_system_prompt": "You are a math tutor helping students understand mathematical concepts.",
    "description": "An AI that helps with math problems.",
    "model": "llama3.2",
    "name": "MathTutor",
    "orchestrator_bot": false,
    "system_prompt": "You are a math tutor helping students understand mathematical concepts."
  }
  ```

## Screenshot
![frontend_example](https://github.com/user-attachments/assets/acd82630-b941-46dd-ba11-bbea111b9798)
Refer to the provided screenshot for an example of the app’s interface, including the stack and agent search functionality.

## Troubleshooting
If you encounter issues during setup, ensure:
- Docker and Docker Compose are correctly installed.
- No other services are running on ports `5173` or `5000`.

For further assistance, consult the project documentation or open an issue on GitHub.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request for review.

