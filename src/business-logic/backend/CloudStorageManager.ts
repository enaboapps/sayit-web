import { getStorage, ref, uploadBytesResumable, getDownloadURL, getMetadata } from "firebase/storage";
import Firebase from "./Firebase";

enum BucketReference {
    publicRef = "gs://sayit-b44d5-pub",
    privateRef = "gs://sayit-b44d5.appspot.com"
}

class CloudStorageManager {
    private auth = Firebase.getAuth();
    private storage = getStorage();

    async uploadFile(name: string, file: File) {
        let uid = "";
        if (this.auth) {
            uid = this.auth.currentUser?.uid || "";
        }
        const firebasePath = `${uid}/data/${name}`;
        const storageRef = ref(this.storage, firebasePath);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            }
        );
        await uploadTask;
    }

    async getFileURL(name: string, reference: BucketReference = BucketReference.privateRef) {
        let uid = "";
        if (this.auth) {
            uid = this.auth.currentUser?.uid || "";
        }
        let firebasePath = "/data/" + name;
        if (reference === BucketReference.privateRef && uid) {
            firebasePath = `${uid}${firebasePath}`;
        }
        const storageRef = ref(this.storage, firebasePath);
        let url = "";
        await getDownloadURL(storageRef)
            .then((downloadURL) => {
                url = downloadURL;
            })
            .catch((error) => {
                console.error(`Error getting download URL: ${error.message}`);
            });
        return url;
    }
}

const downloadSuccessfulTaskDelay = 4.0;

let cloudStorageManager: CloudStorageManager | null = null;

function getCloudStorageManager() {
    if (!cloudStorageManager) {
        cloudStorageManager = new CloudStorageManager();
    }
    return cloudStorageManager;
}

export default getCloudStorageManager;