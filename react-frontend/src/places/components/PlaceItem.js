import React, { useState, useContext } from "react";
import Card from "../../shared/components/UIElements/Card";
import Button from "../../shared/components/FormElements/Button";
import Modal from "../../shared/components/UIElements/Modal";
import Map from "../../shared/components/UIElements/Map";
import { AuthContext } from "../../shared/context/auth-context";
import { useHttpClient } from "../../shared/hooks/http-hook";

import "./PlaceItem.css"
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";

const PlaceItem = (props) => {
    const { isLoading, error, sendRequest, clearError} = useHttpClient();
    const auth  = useContext(AuthContext);
    const [showMap, setShowMap] = useState(false);
    const [showConfirmModel, setShowConfirmModel] = useState(false);

    const openMapHandler = () => setShowMap(true);

    const closeMapHandler = () => setShowMap(false);

    const showDeleteWarningHandler = () => {
        setShowConfirmModel(true);
    };
    const closeDeleteWarningHandler = () => {
        setShowConfirmModel(false);
    };

    const confirmDeleteHandler = async () => {
        setShowConfirmModel(false);
        // console.log('DELETING...')
        try{
            await sendRequest(`${process.env.REACT_APP_BACKEND_URL}/places/${props.id}`,
                "DELETE",
                null,
                {
                    Authorization: "Bearer "+ auth.token
                }
                );
            props.onDelete(props.id);
        }
        catch (err){

        }

    }
    return(
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError}/>
            <Modal
                show={showMap}
                onCancel={closeMapHandler}
                header={props.address}
                ContentClass="place-item__modal-content"
                footerClass="place-item__modal-actions"
                footer={<Button onClick={closeMapHandler}>CLOSE</Button>}
            >
                <div className="map_container">
                    <Map center={props.coordinates} zoom={16}/>
                </div>
            </Modal>
            <Modal
                show={showConfirmModel}
                onCancel={closeDeleteWarningHandler}
                header="Are you sure?"
                footerClass="place-item__modal-actions"
                footer={
                    <React.Fragment>
                        <Button inverse onClick={closeDeleteWarningHandler}>CANCEL</Button>
                        <Button danger onClick={confirmDeleteHandler}>DELETE</Button>
                    </React.Fragment>

                }
            >
                <p>
                    Do you want to proceed and delete this place? Please note that it can't be undone thereafter.
                </p>
            </Modal>
        <li className="place-item">
            <Card className="place-item__content">
                {isLoading && <LoadingSpinner />}
                <div className="place-item__image">
                    <img src={`${process.env.REACT_APP_ASSET_URL}/${props.image}`} alt={props.title} />
                </div>
                <div className="place-item__info">
                    <h2>{props.title}</h2>
                    <h3>{props.address}</h3>
                    <p>{props.description}</p>
                </div>
                <div className="place-item__actions">
                    <Button inverse onClick={openMapHandler}>VIEW ON MAP</Button>
                    {auth.userId === props.creatorId &&
                        <Button to={`/places/${props.id}`}>EDIT</Button>
                    }
                    {auth.userId === props.creatorId &&
                        <Button danger onClick={showDeleteWarningHandler}>DELETE</Button>
                    }
                </div>
            </Card>
        </li>
        </React.Fragment>
    );
}

export default PlaceItem;
