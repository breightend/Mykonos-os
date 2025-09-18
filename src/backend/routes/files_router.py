from flask import Blueprint, jsonify, send_file
from database.database import Database
import base64
import io
import traceback

files_bp = Blueprint("files", __name__)


@files_bp.route("/comprobante/<comprobante_number>", methods=["GET"])
def download_comprobante(comprobante_number):
    """Download receipt file by comprobante number"""
    try:
        db = Database()
        
        # First, try to find the file in account movements
        query = """
        SELECT fa.file_content, fa.file_name, fa.file_extension
        FROM account_movements am
        JOIN file_attachments fa ON am.file_id = fa.id
        WHERE am.numero_de_comprobante = %s
        """
        
        result = db.execute_query(query, (comprobante_number,))
        
        if not result:
            # If not found in account movements, try purchases
            query = """
            SELECT fa.file_content, fa.file_name, fa.file_extension
            FROM purchases p
            JOIN file_attachments fa ON p.file_id = fa.id
            WHERE p.invoice_number = %s
            """
            result = db.execute_query(query, (comprobante_number,))
        
        if not result:
            return jsonify({
                "status": "error", 
                "message": f"No se encontró archivo para el comprobante {comprobante_number}"
            }), 404
        
        file_data = result[0]
        file_content = file_data['file_content'] if isinstance(file_data, dict) else file_data[0]
        file_name = file_data['file_name'] if isinstance(file_data, dict) else file_data[1]
        file_extension = file_data['file_extension'] if isinstance(file_data, dict) else file_data[2]
        
        # Convert file extension to mime type
        mime_type_map = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.txt': 'text/plain',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        mime_type = mime_type_map.get(file_extension.lower(), 'application/octet-stream')
        
        # Decode base64 content
        try:
            file_bytes = base64.b64decode(file_content)
        except Exception as e:
            print(f"Error decoding base64: {e}")
            return jsonify({
                "status": "error", 
                "message": "Error al decodificar el archivo"
            }), 500
        
        # Create file-like object
        file_buffer = io.BytesIO(file_bytes)
        
        # Return file with proper headers
        return send_file(
            file_buffer,
            mimetype=mime_type or 'application/octet-stream',
            as_attachment=True,
            download_name=file_name or f'comprobante_{comprobante_number}.pdf'
        )
        
    except Exception as e:
        print(f"Error downloading comprobante {comprobante_number}: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error", 
            "message": f"Error al descargar el comprobante: {str(e)}"
        }), 500


@files_bp.route("/test", methods=["GET"])
def test_files_route():
    """Test endpoint for files router"""
    return jsonify({
        "status": "success", 
        "message": "Files router is working!"
    }), 200