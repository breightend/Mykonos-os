import { Info } from 'lucide-react'
import { useRef } from 'react'



export default function InfoClientes(cliente) {
    const dialogRef = useRef(null)

    const handleOutsideClick = (e) => {
        if (e.target === dialogRef.current) {
            dialogRef.current.close()
        }
    }

    return (
        <div>
            <button
                className="btn  btn-circle tooltip tooltip-bottom "
                data-tip="Información del cliente"
                onClick={() => dialogRef.current.showModal()}
            >
                <Info className='w-5 h-5' />
            </button>
            <dialog
                ref={dialogRef}
                id="infoClient"
                className="modal backdrop:bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={handleOutsideClick}
            >
                <div className="modal-box max-w-sm md:max-w-lg rounded-2xl p-6">
                    <div className="modal-header bg-gray-800 text-white dark:bg-gray-400 dark:text-black p-4 rounded-2xl flex justify-between items-center mb-4">
                        <h3 className="font-bold text-2xl">Clientes</h3>
                    </div>
                    <div className="text-base-content flex flex-col items-center gap-4">
                        <span>
                            <p>Nombre: </p>
                            <p>{cliente.entity_name}</p>
                            
                        </span>


                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-primary">Cerrar</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    )
}
