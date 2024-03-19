# ft_transcendence_42: A web application with a pong game
An online multiplayer pong game.

## installation
To install the project, you need to have python3 and pip installed on your machine.

Then you can create a virtual environment and install the dependencies using the following commands:
```bash
python3 -m venv venv
```
| Platform | Shell | Command to activate virtual environment |
|---|---|---|
| POSIX | bash/zsh | `$ source venv/bin/activate` |
| POSIX | fish | `$ source venv/bin/activate.fish` |
| POSIX | csh/tcsh | `$ source venv/bin/activate.csh` |
| POSIX | PowerShell | `$ venv/bin/Activate.ps1` |
| Windows | cmd.exe | `C:\> venv\Scripts\activate.bat` |
| Windows | PowerShell | `PS C:\> venv\Scripts\Activate.ps1` |
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Create a .env file in the root directory based on the .envsample file and fill in the required information.

Migrate the database using the following command:
```bash
make migrate
```

You are now ready to run the project.

## Running the project
To run the project, you need to run the following command:
```bash
make run
```

## Technologies
- webGL
- Javascript

## Project architecture

## Credits
