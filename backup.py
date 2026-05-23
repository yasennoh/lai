import os
import zipfile
import datetime

def backup_project(source_dir, backup_file):
    exclude_dirs = {'node_modules', '.next', 'venv', '__pycache__', '.git'}
    
    with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file.endswith('.zip'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

if __name__ == '__main__':
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"c:\\lnsaass\\lnsaass_backup_{timestamp}.zip"
    backup_project("c:\\lnsaass", backup_filename)
    print(f"Backup created successfully at: {backup_filename}")
