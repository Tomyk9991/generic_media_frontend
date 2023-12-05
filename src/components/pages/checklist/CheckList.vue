<script lang="ts">
import {defineComponent} from 'vue'
import {inject} from 'vue';
import {AuthenticatedService, BackendService} from "../../../services/Service";
import List from "../../../models/List";
import EntryElement from "./EntryElement.vue";

export default defineComponent({
    name: "CheckList",
    components: {EntryElement},
    data() {
        return {
            userName: '',
            whoAmI: '',
            list: {entries: []} as List,
            authenticatedService: {} as AuthenticatedService<string> | undefined,
        }
    },
    methods: {
        async logout() {
            if (this.authenticatedService != undefined) {
                await this.authenticatedService.logout();
                this.$router.push("/");
            }
        },
        async addToList() {
            let obj = {title: 'Neuer Eintrag', checked: false, sub_entries: []};

            if (this.list.entries.length === 0) {
                this.list.entries.push(obj);
            } else {
                this.list.entries.unshift(obj);
            }

            await this.saveList();
        },
        async removeFromList(index: number) {
            this.list.entries.splice(index, 1);
            await this.saveList();
        },
        async saveList() {
            if (this.authenticatedService != undefined) {
                await this.authenticatedService.putList(this.userName, this.list);
            }
        }
    },
    async created() {
        this.userName = this.$route.params.user as string;
        let backendService = (inject("backendService")) as BackendService<string>;
        this.authenticatedService = new AuthenticatedService<string>();

        if (await backendService.revalidate()) {
            this.whoAmI = await this.authenticatedService.whoAmI();
            this.list = await this.authenticatedService.getList(this.userName);
        } else {
            await this.logout();
        }

        let url = window.location.href.split('?')[0];
        if (!url.endsWith("/list")) {
            history.pushState({}, '', url + "/list");
        }
    },
    async beforeUnmount() {
        if (this.userName === this.whoAmI) {
            await this.saveList();
        }
    }
})
</script>

<template>
    <v-card v-if="this.list" class="mx-auto">
        <v-list>
            <v-row v-if="this.userName === this.whoAmI" class="mx-2">
                <v-col class="pr-0">
                    <v-btn color="green" block @click="this.addToList">
                        <v-icon>mdi-plus-circle-outline</v-icon>
                    </v-btn>
                </v-col>
                <v-col>
                    <v-btn block @click="this.saveList">
                        <v-icon>mdi-content-save-all</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
            <div v-if="this.list.entries === undefined || this.list.entries.length === 0">
                <div class="v-container mt-5">
                    <div class="d-flex justify-center">
                        <div>
                            Leider hat dieses Profil noch keine Beiträge
                            <v-img src="https://cdn.frankerfacez.com/emoticon/231552/4"></v-img>
                        </div>
                    </div>
                </div>
            </div>
            <div v-for="(listEntry, index) in this.list.entries" :key="index">
                <v-list-item>
                    <v-container>
                        <v-row>
                            <v-col cols="1" align="start" class="mr-15">
                                <v-list-item-action start>
                                    <v-checkbox-btn v-model="listEntry.checked"/>
                                </v-list-item-action>
                            </v-col>

                            <v-col style="cursor: pointer; position: relative">
                                <EntryElement @onSave="this.saveList" :list-entry="this.list.entries[index]"/>
                                <v-btn style="position: absolute; top: 0; right: 0; width: 30px; height: 30px" color="red" @click="removeFromList(index as number)" icon="mdi-close-circle-outline"/>
                            </v-col>

                        </v-row>
                    </v-container>
                    <v-divider/>
                </v-list-item>
            </div>
        </v-list>
    </v-card>
</template>

<style scoped>

</style>