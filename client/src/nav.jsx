import { Link } from 'react-router-dom';
import './App.css';

const Nav = () =>{

    return (

        <nav className='my-nav'>
            <ul className='d-flex' style={{listStyle:"none"}}>
                <li>
                    <Link to = "/">Home</Link>
                </li>
                <li>
                    <Link to = "/about">About</Link>
                </li>
                <li>
                    <Link to = "/services">Services</Link>
                </li>
                <li>
                    <Link to = "/contact">Contact!</Link>
                </li>
            </ul>
        </nav>
    )
}


export default Nav;