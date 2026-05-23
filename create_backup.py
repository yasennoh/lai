import os
import zipfile
from datetime import datetime

def create_backup():
    base_dir = r'c:\lnsaass'
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    zip_name = f'lnsaass_backup_{timestamp}.zip'
    zip_path = os.path.join(base_dir, zip_name)
    
    exclude_dirs = {'node_modules', 'venv', '.next', '.git', '__pycache__'}
    exclude_extensions = {'.zip'}
    
    print(f"Creating backup: {zip_name}...")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            # Modify dirs in-place to exclude unwanted directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if any(file.endswith(ext) for ext in exclude_extensions):
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, base_dir)
                zipf.write(file_path, arcname)
                
    print(f"Successfully created backup at {zip_path}")
    return zip_name

if __name__ == "__main__":
    create_backup()
