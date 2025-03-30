import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'

function Empleados() {
    return (
        <div>
            <MenuVertical currentPath={"/empleados"} />
            <Navbar />
            <div>
                Aca van los empleados
            </div>
        </div>
    )
}

export default Empleados
