import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { generateRandomId } from './utils';
import API from './api';
import './App.css';

function App() {
  const [repoUrl, setRepoUrl] = useState();
  // const [repoId, setRepoId] = useState(0);
  let repoId = 0;

  const [appVersion, setAppVersion] = useState("");
  const [status, setStatus] = useState("");
  const [deployedIds, setDeployedIds] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    handleGetVersion();
    handleGetDeployedIds();
  }, [])

  useEffect(() => {
    setStatus(status);
  }, [status])

  async function handleGetVersion () {
    const resp = await API.get('/api');
    setAppVersion(resp);
  }

  async function handleGetStatus (repoId) {
    const resp = await API.get(`/queue-status/${repoId}`);
    setStatus(resp.status);
    return resp.status;
  }

  function handleRepoUrlChange (e) {
    setRepoUrl(e.target.value);
  }

  async function handleDeployClick () {
    setLoading(true);
    repoId = generateRandomId();
    
    API.post('/clone-and-deploy', {
      repoUrl: repoUrl,
      randomId: repoId,
    })

    let _status = status;
    const inter = setInterval(async () => {
      if (_status === 'complete') {
        setLoading(false);
        handleGetDeployedIds();
        setStatus('');
        clearInterval(inter);
      } 
      _status = await handleGetStatus(repoId);
      console.log(_status);
    }, 2000);
  }

  async function handleDeleteAllClick () {
    setDeleteLoading(true);
    API.delete('/s3/all').then((resp) => {
      console.log(resp.message);
      setDeleteLoading(false);
    })
  }

  async function handleGetDeployedIds () {
    API.get('/s3/all').then((resp) => {
      setDeployedIds([...resp])
    })
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', gap: '100px'}}>
      <div className="container">
        <input placeholder={"Github URL"} value={repoUrl} onChange={handleRepoUrlChange} />
        
        <div style={{display: 'flex', gap: '10px'}}>
          <button disabled={loading} onClick={handleDeployClick} style={{display: 'flex', gap: '10px', padding: '5px'}}>
            Deploy
            <ClipLoader
              size={15}
              loading={loading}
            />
          </button>
          
          <button disabled={deleteLoading} onClick={handleDeleteAllClick} style={{display: 'flex', gap: '10px', padding: '5px'}}>
            Delete All
            <ClipLoader
              size={15}
              loading={deleteLoading}
            />
          </button>
        </div>


        <div>
          <h2>{status !== 'complete' && status}</h2>
        </div>

        <div>
          <p>{appVersion}</p>
        </div>
      </div>
      <div className="container">
        <h4>History <button onClick={handleGetDeployedIds}>fetch</button></h4>
        <ul>
          {
            deployedIds.length ? deployedIds.map((f, ind) => <li key={ind}>{f}</li>) : <p>None</p>
          }
        </ul>
      </div>
    </div>
  );
}

export default App;
