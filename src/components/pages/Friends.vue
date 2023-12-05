<script lang="ts">
import {defineComponent, inject} from 'vue'
import {AuthenticatedService, BackendService, baseURL} from "../../services/Service";
import {LOCALSTORAGE_USERNAME} from "../../utils/Constants";
import axios from "axios";
import Friend from "../../models/User";

export default defineComponent({
    name: "Friends",
    data() {
        return {
            backendService: { } as BackendService<string>,
            whoAmI: '',
            changeLog: '',
            changeLogVersion: 0.0,
            mySelf: {} as any,
            data: [] as Friend[],
            authenticatedService: {} as AuthenticatedService<string> | undefined,
        }
    },
    async created() {
        this.backendService = (inject("backendService")) as BackendService<string>;

        this.authenticatedService = new AuthenticatedService<string>();

        if (await this.backendService.revalidate()) {
            this.whoAmI = await this.authenticatedService.whoAmI();
            this.data = await this.authenticatedService.pullFriends(this.whoAmI);

            let backendChangelogVer = await this.authenticatedService.changeLogVersion();
            let latestChangeLogVersion = parseFloat(localStorage.getItem("changelogVer") ?? "0.0");

            // if never set, or if newer version on server exists
            if (latestChangeLogVersion == 0.0 || latestChangeLogVersion < backendChangelogVer) {
                this.changeLog = await this.authenticatedService.changeLog();
                this.changeLogVersion = backendChangelogVer;

                localStorage.setItem("changelogVer", backendChangelogVer.toString());
            }

            this.mySelf = {
                user_name: this.whoAmI,
                profile_image: `user/${this.whoAmI}/avatar`,
                ...await this.authenticatedService.getFullProfileInformation(this.whoAmI),
            };
        } else {
            await this.logout();
        }
    },
    methods: {
        async logout(): Promise<void> {
            localStorage.removeItem("loggedIn");
            localStorage.removeItem(LOCALSTORAGE_USERNAME);

            await axios.get(`${baseURL}/logout`, {withCredentials: true});
        },
        getProfileImage(suffix: string): string {
            return `${baseURL}/${suffix}`
        }
    }
})
</script>

<template>
    <div class="overlay" v-if="this.changeLog !== undefined && this.changeLog !== ''" @click="this.changeLog">
        <v-container>
            <v-row justify="space-around">
                <v-card width="400">
                    <v-card-text>
                        <div class="font-weight-bold ms-1 mb-2">
                            Changelog {{this.changeLogVersion}}
                        </div>

                        <v-timeline density="compact" align="start">
                            <v-timeline-item
                                v-for="(message, index) in this.changeLog" :key="message" dot-color="orange" size="x-small">
                                <div class="mb-4">
                                    <div class="font-weight-normal">
                                        <strong>{{index + 1}}: </strong>
                                    </div>
                                    <div>{{ message }}</div>
                                </div>
                            </v-timeline-item>
                        </v-timeline>

                        <v-divider class="my-5"/>
                        <v-btn color="orange-lighten-2" @click="this.changeLog = undefined">Ok</v-btn>
                    </v-card-text>
                </v-card>
            </v-row>
        </v-container>
    </div>
    <v-container>
        <v-card class="pa-3 mb-5 mx-5">
            <v-img v-if="mySelf.profile_image" :src="getProfileImage(mySelf.profile_image)" height="200px" cover/>

            <v-card-title>
                Mein Profil: {{mySelf.user_name}}
            </v-card-title>

            <v-card-subtitle v-html="mySelf.description"/>
            <v-card-text>Beiträge {{mySelf.amount_posts}}</v-card-text>
            <v-card-actions>
                <v-btn color="orange-lighten-2" @click="this.$router.push(`/gallery/${mySelf.user_name}`)" variant="text">Auf mein Profil gehen</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
    <v-container>
        <v-row no-gutters>
            <v-col class="item" v-for="element in this.data" cols="12" sm="6" md="4">
                <v-card class="pa-3 mb-5 mx-5 d-flex flex-column" min-height="500px">
                    <v-img :src="getProfileImage(element.profile_image)" height="200px" min-height="200px" max-height="200px" cover />

                    <v-card-subtitle v-html="element.description"/>
                    <v-card-text class="flex-grow-1">Beiträge {{element.amount_posts}}</v-card-text>

                    <v-card-actions class="pt-3">
                        <v-btn color="orange-lighten-2" @click="this.$router.push(`/gallery/${element.user_name}`)" variant="text">Besuchen</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>

    <v-container v-if="this.data === undefined || this.data.length === 0">
        <div class="d-flex justify-center">
            <div>
                Leider hat dieses Profil noch keine Freunde
                <v-img src="https://cdn.frankerfacez.com/emoticon/231552/4"/>
            </div>
        </div>
    </v-container>
</template>

<style scoped>
.overlay {
    position: fixed;
    display: block;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 2;
    cursor: pointer;
}
</style>