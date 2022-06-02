import { useEffect, useState } from "react";
import { shallowEqual, useSelector, useDispatch } from "react-redux";
import {
  TextArea,
  TextInput,
  WebsiteInput,
  RadioInput,
} from "../grants/inputs";
import { RootState } from "../../reducers";
import { fetchGrantData } from "../../actions/grantsMetadata";
import Button, { ButtonVariants } from "./Button";
import { startIPFS, saveFileToIPFS } from "../../actions/ipfs";
import { publishGrant } from "../../actions/newGrant";
import TXLoading from "./TXLoading";

function ProjectForm({ currentGrantId }: { currentGrantId?: string }) {
  const dispatch = useDispatch();
  const props = useSelector((state: RootState) => {
    const grantMetadata = state.grantsMetadata[Number(currentGrantId)];
    return {
      id: currentGrantId,
      loading: grantMetadata ? grantMetadata.loading : false,
      currentGrant: grantMetadata?.metadata,
      ipfsInitialized: state.ipfs.initialized,
      ipfsInitializationError: state.ipfs.initializationError,
      savingFile: state.ipfs.ipfsSavingFile,
      lastFileSaved: state.ipfs.lastFileSavedURL,
      txStatus: state.newGrant.txStatus,
    };
  }, shallowEqual);

  const [disabled, setDisabled] = useState(true);
  const [formInputs, setFormInputs] = useState({
    title: "",
    description: "",
    website: "",
    chain: "",
    wallet: "",
    receivedFunding: "No",
  });
  const publishProject = async () => {
    await dispatch(saveFileToIPFS("test.txt", JSON.stringify(formInputs)));
    dispatch(publishGrant(currentGrantId));
  };

  const handleInput = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    setFormInputs({ ...formInputs, [e.target.name]: value });
    const validValues = Object.values(formInputs).filter((input) => {
      if (typeof input === "string") {
        return input.length > 0;
      }
      return false;
    });

    setDisabled(validValues.length < 5 || !props.ipfsInitialized);
  };

  // TODO: feels like this could be extracted to a component
  useEffect(() => {
    dispatch(startIPFS());
    if (props.ipfsInitialized && currentGrantId) {
      dispatch(fetchGrantData(Number(currentGrantId)));
    }
    const { currentGrant } = props;
    if (currentGrant) {
      setFormInputs({
        title: currentGrant.title,
        description: currentGrant.description,
        website: currentGrant.website,
        chain: currentGrant.chain,
        wallet: currentGrant.wallet,
        receivedFunding: currentGrant.receivedFunding,
      });
    }
  }, [dispatch, props.ipfsInitialized, currentGrantId, props.currentGrant]);

  if (props.ipfsInitializationError) {
    return <>Error initializing IPFS. Reload the page and try again.</>;
  }

  if (!props.ipfsInitialized) {
    return <>Initializing ipfs...</>;
  }

  if (props.loading && props.currentGrant === undefined) {
    return <>Loading grant data from IPFS... </>;
  }
  // /TODO

  return (
    <div className="border border-solid border-secondary-background rounded text-primary-text p-4">
      <form onSubmit={(e) => e.preventDefault()}>
        <TextInput
          label="Title"
          name="title"
          placeholder="Stop destruction in Ukraine"
          value={formInputs.title}
          changeHandler={(e) => handleInput(e)}
        />
        <TextArea
          label="Description"
          name="description"
          placeholder="Describe your project!"
          value={formInputs.description}
          changeHandler={(e) => handleInput(e)}
        />
        <WebsiteInput
          label="Website"
          name="website"
          value={formInputs.website}
          changeHandler={(e) => handleInput(e)}
        />
        <TextInput
          label="Chain"
          name="chain"
          value={formInputs.chain}
          changeHandler={(e) => handleInput(e)}
        />
        <TextInput
          label="Wallet"
          name="wallet"
          value={formInputs.wallet}
          changeHandler={(e) => handleInput(e)}
        />
        Have you raised external funding?
        {formInputs.receivedFunding}
        <RadioInput
          name="receivedFunding"
          value="Yes"
          currentValue={formInputs.receivedFunding}
          changeHandler={(e) => handleInput(e)}
        />
        <RadioInput
          name="receivedFunding"
          value="No"
          currentValue={formInputs.receivedFunding}
          changeHandler={(e) => handleInput(e)}
        />
        <Button
          disabled={disabled}
          variant={ButtonVariants.outline}
          onClick={publishProject}
        >
          Save Data
        </Button>
      </form>
      {props.savingFile && !props.lastFileSaved && (
        <p>Your file is being saved to IPFS</p>
      )}
      {!props.savingFile && props.lastFileSaved && (
        <>
          <p>
            Your file has being saved to IPFS and can be accessed here:{" "}
            {props.lastFileSaved}
          </p>
          {props.txStatus && <TXLoading status={props.txStatus} />}
        </>
      )}
    </div>
  );
}

export default ProjectForm;