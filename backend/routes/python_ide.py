from flask import Blueprint, request, jsonify
import sys
from io import StringIO
import traceback
import importlib
import os
import importlib.util
from . import python_ide_bp

@python_ide_bp.route('/', methods=['GET'])
def test():
    return jsonify({'message': 'Python IDE works!'}), 200

@python_ide_bp.route('/get-scripts', methods=['GET'])
def get_scripts():
    try:
        # Get the modular_intelligence package location
        mi_spec = importlib.util.find_spec('modular_intelligence')
        if mi_spec is None:
            print("Error: modular_intelligence package not found")
            return jsonify({'error': 'modular_intelligence package not found'}), 404
        
        print(f"Found modular_intelligence at: {mi_spec.origin}")
        
        # Get the scripts directory path
        scripts_dir = os.path.join(os.path.dirname(mi_spec.origin), 'scripts')
        print(f"Looking for scripts in: {scripts_dir}")
        
        if not os.path.exists(scripts_dir):
            print(f"Error: scripts directory not found at {scripts_dir}")
            return jsonify({'error': 'scripts directory not found'}), 404
        
        scripts = {}
        
        # List all Python files in the directory
        all_files = os.listdir(scripts_dir)
        script_files = [f for f in all_files if f.endswith('.py')]
        print(f"Found Python files in directory: {script_files}")
        
        for script_file in script_files:
            file_path = os.path.join(scripts_dir, script_file)
            print(f"Reading file: {file_path}")
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    # Convert filename to display name (replace underscores with spaces)
                    display_name = os.path.splitext(script_file)[0].replace('_', ' ')
                    scripts[script_file] = {
                        'name': display_name,
                        'code': f.read()
                    }
                print(f"Successfully loaded: {script_file}")
        
        print(f"Total scripts loaded: {len(scripts)}")
        return jsonify(scripts)
    except Exception as e:
        print(f"Error in get_scripts: {str(e)}")
        return jsonify({'error': str(e)}), 500

@python_ide_bp.route('/run-python', methods=['POST'])
def run_python():
    code = request.json.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400
    
    # Create string buffers to capture output and errors
    output_buffer = StringIO()
    error_buffer = StringIO()
    
    # Store original stdout and stderr
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    
    try:
        # Initialize colorama
        import colorama
        colorama.init()
        
        # Redirect stdout and stderr to our buffers
        sys.stdout = output_buffer
        sys.stderr = error_buffer
        
        # Add custom imports to globals
        globals_dict = {
            '__builtins__': __builtins__,
            'importlib': importlib,
            'sys': sys,
            'colorama': colorama,
            'Fore': colorama.Fore,
            'Back': colorama.Back,
            'Style': colorama.Style
        }
        
        # Try to import modular-intelligence
        try:
            mi = importlib.import_module('modular_intelligence')
            globals_dict['mi'] = mi
        except ImportError:
            error_buffer.write("Warning: modular-intelligence package not found. Please install it first.\n")
        
        # Execute the code with our custom globals
        exec(code, globals_dict)
        
        # Get the output and errors
        output = output_buffer.getvalue()
        errors = error_buffer.getvalue()
        
        return jsonify({
            'output': output,
            'error': errors if errors else None,
            'hasAnsiCodes': True
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500
    finally:
        # Reset stdout and stderr
        sys.stdout = original_stdout
        sys.stderr = original_stderr
        colorama.deinit()
