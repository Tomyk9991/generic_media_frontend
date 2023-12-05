<script lang="ts">
import {defineComponent, inject} from 'vue'
import Explorer from "./Explorer.vue";
import {AuthenticatedService, BackendService} from "../../services/Service";
import UserProfile from "../../models/UserProfile";
import RainbowAvatar from "../RainbowAvatar.vue";
import CheckList from "./checklist/CheckList.vue";
import ImageVideoGridChild from "./ImageVideoGridChild.vue";

enum ProfileSubPage {
    Explorer,
    List,
    Custom,
    None
}
export default defineComponent({
    name: "Profile",
    components: {ImageVideoGridChild, CheckList, RainbowAvatar, Explorer},
    data() {
        return {
            userName: '',
            selected: ProfileSubPage.None,
            needRefresh: 0,
            dialog: false,
            innerWidth: undefined as number | undefined,
            fullProfile: {} as UserProfile,

            storyBoardIndex: 0,
            allStories: [] as string[],
            lastSeen: '',
            highlightedImage: '',

            whoAmI: '',
            uploadStatusMessage: '',
            uploadPercentage: 0,
            authenticatedService: {} as AuthenticatedService<string> | undefined,
        }
    },
    async created() {
        this.userName = this.$route.params.user as string;
        let backendService = (inject("backendService")) as BackendService<string>;

        this.authenticatedService = new AuthenticatedService<string>();

        if (!await backendService.revalidate()) {
            await this.logout();
        }


        this.selected = window.location.href.endsWith("/list") ? ProfileSubPage.List : ProfileSubPage.Explorer;
    },
    unmounted() {
        window.removeEventListener('paste', this.userPasted);
    },
    async mounted() {

        window.addEventListener('resize', () => {
            this.innerWidth = window.innerWidth;
        })

        if (this.authenticatedService != undefined) {
            this.fullProfile = await this.authenticatedService.getFullProfileInformation(this.userName) as UserProfile;
            this.whoAmI = await this.authenticatedService.whoAmI();
            window.addEventListener('paste', this.userPasted);

            this.allStories = await this.authenticatedService.storyBoard(this.userName);
            await this.updateStoryBoard();
        }
    },
    methods: {
        swipe(d: string) {
            this.direction = d;
        },
        async userPasted(event: ClipboardEvent) {
            event.preventDefault();

            let data = new FormData();
            let counter = 0;
            if (event.clipboardData !== null) {
                for (const item of event.clipboardData.items) {
                    if (item.getAsFile() != null) {
                        const allowedFiles = [".jpeg", ".jpg", ".png", ".mov", ".m4v", ".mp4"];
                        let file = item.getAsFile();

                        for (const allowedFile of allowedFiles) {
                            if (file != null) {
                                if (file.name.endsWith(allowedFile)) {
                                    data.append('file', file, file.name);
                                    counter++;
                                }
                            }
                        }
                    }
                }
            }

            if (counter > 0) {
                this.uploadStatusMessage = await this.authenticatedService.uploadMediaFiles(data, this.userName, (e: any) => {
                    this.uploadPercentage = e.progress * 100;

                    if (this.uploadPercentage === 100) {
                        setTimeout(async () => {
                            this.uploadPercentage = 0;
                            this.uploadStatusMessage = '';
                            this.needRefresh++;

                            this.fullProfile = await this.authenticatedService.getFullProfileInformation(this.userName) as UserProfile;
                        }, 3000);
                    }
                });
            }
        },
        async updateStoryBoard() {
            this.lastSeen = await this.authenticatedService.lastSeenStory(this.whoAmI, this.userName);
            this.storyBoardIndex = this.allStories.indexOf(this.lastSeen);
        },
        showStory() {
            if (this.allStories.length > 0) {
                this.storyBoardIndex = Math.max(Math.min(this.storyBoardIndex, this.allStories.length - 1), 0);

                this.highlightedImage = this.authenticatedService.getAvatarUrlFromName(this.userName, this.allStories[this.storyBoardIndex]);
                this.authenticatedService.lastSeenStoryUpdate(this.whoAmI, this.userName, this.allStories[this.storyBoardIndex]);

                this.updateStoryBoard();
            }
        },
        setToExplorer() {
            this.selected = ProfileSubPage.Explorer
        },
        isExplorer() {
            return this.selected === ProfileSubPage.Explorer;
        },
        setToList() {
            this.selected = ProfileSubPage.List;
        },
        isList() {
            return this.selected === ProfileSubPage.List;
        },
        isCustom() {
            return this.selected === ProfileSubPage.Custom;
        },
        handleFileImportStory() {
            (this.$refs.storyUploader as any).click();
        },
        handleFileImportContent() {
            (this.$refs.contentUploader as any).click();
        },
        async onFileChangedStory(e: any) {
            await this.onFileChanged(e, 1);
        },

        async onFileChangedContribution(e: any) {
            await this.onFileChanged(e, 0);
        },
        async onFileChanged(e: any, state: number) {
            if (this.authenticatedService != undefined) {
                if (state === 0) {
                    this.uploadStatusMessage = await this.authenticatedService.uploadMedia(e.target.files, this.userName, (e: any) => {
                        this.uploadPercentage = e.progress * 100;

                        if (this.uploadPercentage === 100) {
                            setTimeout(async () => {
                                this.uploadPercentage = 0;
                                this.uploadStatusMessage = '';
                                this.needRefresh++;

                                this.fullProfile = await this.authenticatedService.getFullProfileInformation(this.userName) as UserProfile;
                            }, 3000);
                        }
                    });
                } else if (state === 1) {
                    this.uploadStatusMessage = await this.authenticatedService.uploadStories(e.target.files, this.userName, (e: any) => {
                        this.uploadPercentage = e.progress * 100;

                        if (this.uploadPercentage === 100) {
                            setTimeout(async () => {
                                this.uploadPercentage = 0;
                                this.uploadStatusMessage = '';
                                this.needRefresh++;

                                this.fullProfile = await this.authenticatedService.getFullProfileInformation(this.userName) as UserProfile;

                                this.allStories = await this.authenticatedService.storyBoard(this.userName);
                                await this.updateStoryBoard();
                            }, 3000);
                        }
                    });
                }
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
    <!--    Actions-->
    <div align="end" class="mr-2 mt-2">
        <v-btn @click="this.handleFileImportStory" v-if="this.userName === this.whoAmI">
            Story
            <v-icon dark>mdi-image-frame</v-icon>
        </v-btn>
        <input multiple @change="onFileChangedStory" class="d-none" v-if="this.userName === this.whoAmI"
               ref="storyUploader"
               type="file" accept=".jpeg,.jpg,.png,.mov,.m4v,.mp4">
        <v-btn @click="this.handleFileImportContent" v-if="this.userName === this.whoAmI">
            Beitrag
            <v-icon dark>mdi-plus-box-multiple-outline</v-icon>
        </v-btn>
        <input multiple @change="onFileChangedContribution" class="d-none" v-if="this.userName === this.whoAmI"
               ref="contentUploader"
               type="file" accept=".jpeg,.jpg,.png,.mov,.m4v,.mp4">

        <v-divider class="ml-5" vertical/>
        <v-btn @click="this.$router.push(`/edit`);" v-if="this.userName === this.whoAmI || this.whoAmI">
            <v-icon>mdi-account-edit</v-icon>
        </v-btn>
        <v-dialog v-model="dialog" width="auto">
            <template v-slot:activator="{ props }">
                <v-divider vertical/>
                <v-btn v-bind="props">
                    <v-icon color="red">mdi-logout</v-icon>
                </v-btn>
            </template>

            <v-card>
                <v-card-text>
                    <v-container>
                        <v-icon size="100">mdi-logout</v-icon>
                        Du bist im Begriff dich auszuloggen. Bist du dir sicher?
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-btn rounded variant="outlined" block @click="dialog = false">
                        <v-icon class="mr-2">mdi-keyboard-backspace</v-icon>
                        Neee, war ein versehen
                    </v-btn>
                </v-card-actions>
                <v-card-actions>
                    <v-btn rounded variant="outlined" block @click="dialog = false; this.logout()">
                        <v-icon class="mr-2">mdi-hand-wave</v-icon>
                        Yep, machs gut
                        <v-icon class="ml-2">mdi-hand-wave</v-icon>
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>

    <v-container v-if="uploadPercentage != 0 || this.uploadStatusMessage !== ''">
        <v-row class="justify-center">
            <div
                :class="{'text-red': this.uploadStatusMessage !== 'ok', 'text-green': this.uploadStatusMessage === 'ok' }">
                {{ uploadStatusMessage }}
            </div>
        </v-row>
        <v-row v-if="uploadPercentage != 0" class="justify-center mx-15">
            <v-progress-linear :buffer-value="uploadPercentage" stream></v-progress-linear>
        </v-row>
    </v-container>
    <!--    Profile Header-->
    <div class="flex-container mt-2">
        <div class="flex-items">
            <rainbow-avatar @click="showStory" :disable-ring="this.allStories.length - 1 === this.storyBoardIndex"
                            :user-name="this.userName"/>
        </div>
        <div class="flex-items">
            <div class="d-flex align-center">
                <h2>{{ this.userName }}</h2>
                <v-icon icon="mdi-check-decagram" size="18" color="blue" class="ml-1"/>
            </div>
            <div>
                <v-label> {{ this.fullProfile.amount_posts }} Beiträge</v-label>
                <div style="margin-top: 20px" v-html="this.fullProfile.description"/>
            </div>
        </div>
    </div>
    <v-divider class="mt-10" style="margin-left: 5%; margin-right: 5%;"/>
    <v-card-actions class="d-flex justify-center" v-if="!isCustom()">
        <div>
            <v-btn @click="setToExplorer()" prepend-icon="mdi-grid">Beiträge</v-btn>
            <v-divider thickness="3" v-if="isExplorer()"></v-divider>
        </div>
        <div>
            <v-btn @click="setToList()" prepend-icon="mdi-content-save-all">Gespeicherte Liste</v-btn>
            <v-divider color="white" thickness="2" v-if="isList()"></v-divider>
        </div>
    </v-card-actions>

    <!--    Actual Content-->
    <div class="v-container mt-5">
        <div class="d-flex justify-center">
            <div
                :class="{'w-75': this.innerWidth > 1280 || this.innerWidth === undefined, 'w-100': this.innerWidth <= 1280 }">
                <Explorer v-if="isExplorer()" :key="needRefresh"/>
                <CheckList v-if="isList()"/>
            </div>
        </div>
    </div>

    <!--    Overlay-->
    <div class="overlay" v-if="this.highlightedImage">
        <v-container class="w-100">
            <v-row class="justify-center mt-10 mb-4" align="center">
                <v-btn-toggle>
                    <v-btn :disabled="this.storyBoardIndex === 0" @click="this.storyBoardIndex--; this.showStory();">
                        <v-icon>mdi-pan-left</v-icon>
                    </v-btn>
                    <v-btn @click="this.highlightedImage = undefined;">
                        <v-icon>mdi-image-area-close</v-icon>
                    </v-btn>
                    <v-btn :disabled="this.storyBoardIndex === this.allStories.length - 1"
                           @click="this.storyBoardIndex = Math.max(this.storyBoardIndex + 1, 0); this.showStory();">
                        <v-icon>mdi-pan-right</v-icon>
                    </v-btn>
                </v-btn-toggle>
                <div class="story-container w-100">
                    <div v-for="index in this.allStories.length" :key="index" :class="{
                        'story-box-colored': this.storyBoardIndex - 1 >= index - 1,
                        'story-box-selected': this.storyBoardIndex + 1 === index,
                        'story-box': this.storyBoardIndex < index,
                    }"></div>
                </div>
            </v-row>
            <v-row class="justify-center" align="center">
                <ImageVideoGridChild :not-cover="true" style="height: 80vh; width: 100%" :src="this.highlightedImage"
                                     :key="this.highlightedImage"/>
            </v-row>
        </v-container>
    </div>

</template>

<style scoped>

.story-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px;
}

.story-box {
    width: 100%;
    height: 10px; /* Adjust the height as needed */
    background-color: #515151;
    margin-right: 5px;
    border-radius: 5px;
}

.story-box-selected {
    width: 100%;
    height: 10px; /* Adjust the height as needed */
    background-color: yellow;
    margin-right: 5px;
    border-radius: 5px;
}

.story-box-colored {
    width: 100%;
    height: 10px; /* Adjust the height as needed */
    background-color: #f50;
    margin-right: 5px;
    border-radius: 5px;
}

.overlay {
    position: fixed;
    display: block;
    overflow: hidden;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 2;
    cursor: pointer;
}

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