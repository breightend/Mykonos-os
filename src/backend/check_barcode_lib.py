import sys
import subprocess

# Intentar importar python-barcode
try:
    import barcode
    print("✅ python-barcode instalado correctamente")
    print(f"📦 Versión: {barcode.__version__}")
    
    from barcode import Code128
    from barcode.writer import SVGWriter
    print("✅ Importación de Code128 y SVGWriter exitosa")
    
    # Probar generar un código básico
    code = Code128("TEST123", writer=SVGWriter())
    print("✅ Creación de código de barras básico exitosa")
    
    print("\n🎯 ¡Todo parece estar funcionando correctamente!")
    
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("💡 Instalando python-barcode...")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "python-barcode"])
        print("✅ python-barcode instalado exitosamente")
    except subprocess.CalledProcessError as install_error:
        print(f"❌ Error instalando: {install_error}")
        
except Exception as e:
    print(f"❌ Error inesperado: {e}")
