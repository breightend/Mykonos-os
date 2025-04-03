import { Info } from 'lucide-react'
import { useRef } from 'react'

//TODO: Hacerlo otra pantalla entonces es m[as facil de implementar el modal para modificar una compra o tener mas informacion al respecto.

export default function InfoClientes({ cliente }) {
    console.log("cliente")
    console.log(cliente)
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
                <div className="modal-box w-11/12 max-w-5xl h-9/12 rounded-2xl p-6">
                    <div className="modal-header bg-gray-800 text-white dark:bg-gray-400 dark:text-black p-4 rounded-2xl flex justify-between items-center mb-4">
                        {cliente ? (

                            <h3 className="font-bold text-2xl">{cliente.entity_name}</h3>
                        ) : (
                            <h3 className="font-bold text-2xl">Cliente no seleccionado</h3>
                        )}                   </div>
                    <div className="text-base-content flex flex-col items-center gap-4">
                        <div className="overflow-x-auto">
                            {/* head */}
                            {cliente && (

                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Nombre y apellido</th>
                                            <th>DNI o CUIT</th>
                                            <th>Celular</th>
                                            <th>Domicilio</th>
                                            <th>Mail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* row 1 */}
                                        <tr>
                                            <th>1</th>
                                            <td>{cliente.entity_name}</td>
                                            <td>{cliente.entity_name}</td>
                                            <td>{cliente.entity_name}</td>
                                            <td>{cliente.entity_name}</td>

                                        </tr>
                                    </tbody>
                                </table>

                            )}
                        </div>
                        <div>
                            <h2 className='text-2xl font-semibold'> Registro de compras </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table-xs">
                                {/* head */}
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Name</th>
                                        <th>Job</th>
                                        <th>Favorite Color</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* row 1 */}
                                    <tr>
                                        <th>1</th>
                                        <td>Cy Ganderton</td>
                                        <td>Quality Control Specialist</td>
                                        <td>Blue</td>
                                    </tr>
                                    {/* row 2 */}
                                    <tr>
                                        <th>2</th>
                                        <td>Hart Hagerty</td>
                                        <td>Desktop Support Technician</td>
                                        <td>Purple</td>
                                    </tr>
                                    {/* row 3 */}
                                    <tr>
                                        <th>3</th>
                                        <td>Brice Swyre</td>
                                        <td>Tax Accountant</td>
                                        <td>Red</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

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
