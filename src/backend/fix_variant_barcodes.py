#!/usr/bin/env python3
"""
Script para verificar y corregir códigos de barras de variantes
"""

import subprocess
import sys
import os


def run_script(script_name, description):
    """
    Ejecuta un script y muestra el resultado
    """
    print(f"\n🔄 Ejecutando: {description}")
    print(f"📄 Script: {script_name}")
    print("-" * 50)

    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )

        if result.stdout:
            print("STDOUT:")
            print(result.stdout)

        if result.stderr:
            print("STDERR:")
            print(result.stderr)

        if result.returncode == 0:
            print(f"✅ {description} completado exitosamente")
        else:
            print(f"❌ {description} falló con código {result.returncode}")

        return result.returncode == 0

    except Exception as e:
        print(f"❌ Error ejecutando {script_name}: {e}")
        return False


def main():
    """
    Función principal que ejecuta todos los scripts necesarios
    """
    print("🔧 Verificación y corrección de códigos de barras de variantes")
    print("=" * 60)

    # Lista de scripts a ejecutar en orden
    scripts = [
        ("verify_barcodes.py", "Verificación de estructura de base de datos"),
        (
            "generate_missing_variant_barcodes.py",
            "Generación de códigos de barras faltantes",
        ),
        ("verify_barcodes.py", "Verificación final de códigos de barras"),
    ]

    success_count = 0

    for script_name, description in scripts:
        if os.path.exists(script_name):
            success = run_script(script_name, description)
            if success:
                success_count += 1
        else:
            print(f"⚠️ Script {script_name} no encontrado, saltando...")

    print("\n" + "=" * 60)
    print(
        f"🎉 Proceso completado: {success_count}/{len(scripts)} scripts ejecutados exitosamente"
    )

    if success_count == len(scripts):
        print(
            "✅ Todos los códigos de barras de variantes deberían estar correctos ahora"
        )
        print("🚀 Puedes reiniciar el servidor y probar el inventario")
    else:
        print("⚠️ Algunos scripts fallaron. Revisa los errores arriba.")


if __name__ == "__main__":
    main()
