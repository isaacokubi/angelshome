import { useNavigate } from "react-router-dom";


function Login(){

    const navigate = useNavigate();


    const handleLogin = async (e)=>{

        e.preventDefault();

        const response = await loginUser({
            email,
            password
        });


        const user = response.data;


        if(user.role === "admin"){

            navigate("/admin");

        }else{

            navigate("/");

        }

    };


    return(
        <form onSubmit={handleLogin}>
            ...
        </form>
    );
}


export default Login;