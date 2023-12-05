<script lang="ts">
import {defineComponent, inject} from 'vue'
import UserProfile from "../../models/UserProfile";
import {AuthenticatedService, BackendService, baseURL} from "../../services/Service";
import RainbowAvatar from "../RainbowAvatar.vue";

export default defineComponent({
    name: "EditProfile",
    components: {RainbowAvatar},
    data() {
        return {
            updatedProfileImage: undefined,
            updatedProfileImageFileRef: undefined,
            newProfileImage: false,
            userName: '',
            fullProfile: {} as UserProfile,
            whoAmI: '',
            authenticatedService: {} as AuthenticatedService<string> | undefined,
        }
    },
    async created() {
        let backendService = (inject("backendService")) as BackendService<string>;

        this.authenticatedService = new AuthenticatedService<string>();

        if (!await backendService.revalidate()) {
            await this.logout();
        }
    },
    async mounted() {
        if (this.authenticatedService != undefined) {
            this.whoAmI = await this.authenticatedService.whoAmI();
            this.userName = this.whoAmI;
            await this.getImage();
            this.fullProfile = await this.authenticatedService.getFullProfileInformation(this.userName) as UserProfile;
        }
    },
    methods: {
        handleFileImport() {
            (this.$refs.uploader as any).click();
        },
        async getImage() {
            if (this.userName === '' || this.userName === undefined) {
                return;
            }

            this.newProfileImage = false;

            try {
                const response = await fetch(`${baseURL}/user/${this.userName}/avatar`, { method: 'GET', credentials: "include" })
                const data = await response.blob();

                this.updatedProfileImage = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader as any).result);
                    reader.onerror = reject;
                    reader.readAsDataURL(data);
                });
            } catch (e) {
                console.log(`Error: ${e}`);
            }
        },
        async getImageFromFile(file: File) {
            try {
                this.updatedProfileImage = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader as any).result);
                    reader.onerror = reject;

                    reader.readAsDataURL(file);
                });
            } catch (e) {
                console.log(`Error: ${e}`);
            }
        },
        async onFileChanged(e: any) {
            if (e.target.files[0] !== undefined) {
                this.updatedProfileImageFileRef = e.target.files[0];
                await this.getImageFromFile(e.target.files[0]);
                this.newProfileImage = true;
            } else {
                this.updatedProfileImageFileRef = undefined;
                await this.getImage();
                this.newProfileImage = false;
            }
        },
        async updateProfile() {
            if (this.authenticatedService != undefined) {
                if (this.newProfileImage && this.updatedProfileImageFileRef !== undefined) {
                    await this.authenticatedService.uploadAvatar(this.updatedProfileImageFileRef, this.userName);
                }

                await this.authenticatedService.putDescription(this.fullProfile.description, this.userName);
            }
        },
        async logout() {
            if (this.authenticatedService != undefined) {
                await this.authenticatedService.logout();
                this.$router.push("/");
            }
        }
    }
})
</script>

<template>
    <v-container align="center">
        <div>Profilbild bearbeiten:</div>
        <v-img @click="this.handleFileImport" v-if="this.userName" :src="this.updatedProfileImage" height="200" class="mb-2"/>
        <v-btn v-if="this.newProfileImage" @click="this.getImage"><v-icon>mdi-image-remove</v-icon></v-btn>
        <v-divider class="mt-5 mb-5"/>
        <div>Beschreibung bearbeiten:</div>
        <v-text-field v-model="this.fullProfile.description" hint="Um ein neue Zeile zu machen `<br>` eingeben"/>
        <v-icon size="100">mdi-arrow-down-bold</v-icon>
        <v-divider class="mb-5"/>
        <h2 class="d-flex justify-center mb-2">Preview:</h2>
    </v-container>

    <input @change="onFileChanged" class="d-none" v-if="this.userName === this.whoAmI" ref="uploader" type="file"
           accept=".jpeg,.jpg,.png">

    <div v-if="this.userName" class="flex-container mt-2">
        <div class="flex-items">
            <rainbow-avatar :disable-ring="false" :user-name="this.userName" :src="this.updatedProfileImage" :key="this.updatedProfileImage"/>
        </div>
        <div class="flex-items">
            <div class="d-flex align-center">
                <h2>{{this.userName}}</h2>
                <v-icon icon="mdi-check-decagram" size="18" color="blue" class="ml-1"/>
            </div>
            <div>
                <v-label> {{ this.fullProfile.amount_posts }} Beiträge </v-label>
                <div style="margin-top: 20px" v-html="this.fullProfile.description"/>
            </div>
        </div>
    </div>

    <v-container  class="mt-5" align="center">
        <v-divider class="mb-5"/>
        <h2>Möchtest du diese Änderungen übernehmen?</h2>
        <v-btn @click="this.updateProfile"><v-icon>mdi-transfer</v-icon></v-btn>
    </v-container>
</template>

<style scoped>
.flex-container {
    margin-left: 5%;
    margin-right: 5%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: stretch;
    align-content: stretch;
}

.flex-items:nth-child(1) {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: auto;
    align-self: auto;
    order: 0;
}

.flex-items:nth-child(2) {
    display: block;
    flex-grow: 2;
    flex-shrink: 1;
    flex-basis: auto;
    align-self: auto;
    order: 0;
}
</style>