import inspect


def print_debug(*args):
    """
    Imprime un mensaje junto con la información de la línea y archivo desde donde se invoca.
    """
    # Obtener el marco de la llamada (uno hacia atrás en la pila de llamadas)
    caller_frame = inspect.stack()[1]
    file_name = caller_frame.filename
    line_number = caller_frame.lineno
    # Imprimir el mensaje junto con la información de contexto
    print(f"[{file_name}:{line_number}] ", *args)