import React, { useEffect, useState } from "react";
import UsersList from "../components/UsersList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";


const Users = () => {
    // const [isLoading, setIsLoading] = useState(false);
    // const [error, setError] = useState();
    const {isLoading, error, sendRequest, clearError} = useHttpClient();
    const [loadedUsers, setLoadedUsers] = useState();
    useEffect(() => {
        const fetchUsers = async () => {
            // setIsLoading(true);
            try{
                const responseData = await sendRequest(process.env.REACT_APP_BACKEND_URL + "/users");//fetch default as a GET request

                // const responseData = await response.json();
                //
                // if(!response.ok){
                //     throw new Error(responseData.message);
                // }
                //
                setLoadedUsers(responseData.users);
            }catch (err){
                // setError(err.message);
            }
            // setIsLoading(false);
        };
        fetchUsers();

    },[sendRequest]);
    // const errorHandler = () => {
    //     // setError(null);
    // };

    // const USERS = [
    //     {
    //         id: 'u1',
    //         name: 'Ryan',
    //         image: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__480.jpg",
    //         places: 3
    //     }
    // ];

    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={ clearError}/>
            {isLoading && <div className="center">
                <LoadingSpinner />
            </div>}
            {!isLoading && loadedUsers && <UsersList items={loadedUsers}/>}
        </React.Fragment>

    );
};
export default Users;
