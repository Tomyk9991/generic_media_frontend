import axios from 'axios';
import {LOCALSTORAGE_USERNAME} from "../utils/Constants";
import UserProfile from "../models/UserProfile";
import List from "../models/List";
import Friend from "../models/User";

export const baseURL = window.location.protocol + "//" + window.location.hostname + "/api";
export class AuthenticatedService<T> {
    public async getContentPagination(userName: string, limit: number, offset: number): Promise<Array<T>> {
        return (await axios.get(`${baseURL}/media/${userName}?limit=${limit}&offset=${offset}`, {withCredentials: true})).data;
    }

    async getList(userName: string): Promise<List> {
        try {
            let response = await axios.get(`${baseURL}/user/${userName}/list`, {withCredentials: true});
            if (response.status === 200) {
                return response.data;
            }

        } catch (e) {
            return {entries: []} as List;
        }

        return {entries: []} as List;
    }

    async putList(userName: string, list: List): Promise<void> {
        return (await axios.put(`${baseURL}/user/${userName}/list`, list, {withCredentials: true}));
    }

    async changeLogVersion(): Promise<number> {
        return (await axios.get(`${baseURL}/changelog/version`, {withCredentials: true})).data;
    }

    async changeLog(): Promise<string> {
        return (await axios.get(`${baseURL}/changelog`, {withCredentials: true})).data;
    }

    async pullFriends(userName: string): Promise<Friend[]> {
        return (await axios.get(`${baseURL}/user/${userName}/friends`, { withCredentials: true})).data;
    }


    async logout(): Promise<void> {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem(LOCALSTORAGE_USERNAME);

        await axios.get(`${baseURL}/logout`, {withCredentials: true});
    }

    async uploadMedia(files: FileList, user: string, progressEvent: ((progressEvent: any) => void | undefined)): Promise<string> {
        if (files.length === 0) {
            return "Du hast keine Inhalte ausgewählt";
        }

        let data = new FormData();
        for (let i = 0; i < files.length; i++) {
            let file: File | null = files.item(i);

            if (file != null) {
                data.append('file', file, file.name);
            }
        }

        return await this.uploadMediaFiles(data, user, progressEvent);
    }

    async uploadMediaFiles(data: FormData, user: string, progressEvent: ((progressEvent: any) => void | undefined)): Promise<string> {
        let response = await axios.post(`${baseURL}/media/${user}`, data, {
            withCredentials: true,
            onUploadProgress: progressEvent,
            headers: {
                'accept': 'application/json',
                'Content-Type': `multipart/form-data`
            }
        });

        if (response.status !== 200) {
            return response.status.toString();
        }

        return "ok";
    }

    async uploadStories(files: FileList, user: string, progressEvent: ((progressEvent: any) => void | undefined)): Promise<string> {
        if (files.length === 0) {
            return "Du hast keine Inhalte ausgewählt";
        }

        let data = new FormData();
        for (let i = 0; i < files.length; i++) {
            let file: File | null = files.item(i);

            if (file != null) {
                data.append('file', file, file.name);
            }
        }

        let response = await axios.post(`${baseURL}/media/stories/${user}`, data, {
            withCredentials: true,
            onUploadProgress: progressEvent,
            headers: {
                'accept': 'application/json',
                'Content-Type': `multipart/form-data`
            }
        });

        if (response.status !== 200) {
            return response.status.toString();
        }

        return "ok";
    }

    async putDescription(new_description: string, user: string): Promise<void> {
        await axios.put(`${baseURL}/user/${user}/information`, {
            description: new_description
        }, {
            withCredentials: true,
        });
    }

    async uploadAvatar(file: File | undefined, user: string): Promise<void> {
        if (file === undefined) {
            return;
        }

        let data = new FormData();
        data.append('file', file, "avatar.jpeg");

        await axios.post(`${baseURL}/user/${user}/avatar`, data, {
            withCredentials: true,
            headers: {
                'accept': 'application/json',
                'Content-Type': `multipart/form-data`
            }
        });
    }

    async getFullProfileInformation(userName: string): Promise<UserProfile> {
        return (await axios.get(`${baseURL}/user/${userName}/information`, {withCredentials: true})).data as UserProfile;
    }

    async whoAmI(): Promise<string> {
        return (await axios.get(`${baseURL}/whoAmI`, {withCredentials: true})).data as string;
    }

    async storyBoard(userName: string): Promise<string[]> {
        return (await axios.get(`${baseURL}/media/stories/${userName}`, { withCredentials: true})).data as string[];
    }

    getAvatarUrlFromName(userName: string, imageName: string): String {
        return `${baseURL}/media/stories/${userName}/${imageName}`;
    }

    async lastSeenStoryUpdate(whoAmI: string, userName: string, lastSeen: string): Promise<void> {
        localStorage.setItem(`seenStories as ${whoAmI} for ${userName}`, lastSeen);
    }

    async lastSeenStory(whoAmI: string, userName: string): Promise<string> {

        let seenStoryString = localStorage.getItem(`seenStories as ${whoAmI} for ${userName}`);

        if (seenStoryString != null) {
            return seenStoryString;
        }

        return "";
    }
}

export interface BackendService<T> {
    authenticate: (username: string, password: string) => Promise<AuthenticatedService<T> | undefined>
    authenticate_with_message: (username: string, password: string) => Promise<AuthenticatedService<T> | string>
    revalidate: () => Promise<boolean>
}

export class ImageBackendService implements BackendService<string> {
    async authenticate(username: string, password: string): Promise<AuthenticatedService<string> | undefined> {
        let status = 400;
        await axios.get(`${baseURL}/authCookie`, {
            auth: {
                username: username,
                password: password
            },
            withCredentials: true
        }).then((response) => {
            status = response.status;
        }).catch((err) => {
        });

        if (status === 200) {
            return new AuthenticatedService<string>();
        }

        return undefined;
    }

    async authenticate_with_message(username: string, password: string): Promise<AuthenticatedService<string> | string> {
        let status = 400;
        let statusText = 'WRONG';
        await axios.get(`${baseURL}/authCookie`, {
                auth: {
                    username: username,
                    password: password
                },
                withCredentials: true
            }
        ).then((response) => {
            status = response.status;
        }).catch((err) => {
            statusText = JSON.stringify(err);
        });

        if (status === 200) {
            return new AuthenticatedService<string>();
        }

        return statusText;
    }

    async revalidate(): Promise<boolean> {
        let status = 0;
        await axios.get(`${baseURL}/authCookie/revalidate`, {withCredentials: true}
        ).then((response) => {
            status = response.status;
        }).catch((err) => {
        });

        return status === 200;
    }
}