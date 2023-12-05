<script lang="ts">
import {defineComponent, inject} from 'vue'
import {AuthenticatedService, BackendService} from "../../../services/Service";

export default defineComponent({
    name: "EntryElement",
    props: {
        listEntry: {
            required: true,
            type: Object
        }
    },
    async created() {
    },
    watch: {
        dialog(newDialog, oldDialog) {
            if (newDialog === false) {
                this.$emit('onSave');
            }
        }
    },
    data() {
        return {
            dialog: false,
        }
    },
    methods: {
        removeFromList(index: number) {
            this.listEntry.sub_entries.splice(index, 1);
            this.$emit("onSave");
        },
        addEmptyToList() {
            this.listEntry.sub_entries.push({title: '', checked: false});
            this.$emit("onSave");
        }
    },
})
</script>

<template>
    <div>
        <v-dialog v-model="this.dialog">
            <template v-slot:activator="{props}">
                <div @click="props.onClick">
                    <h3>{{ this.listEntry.title}}</h3>
                    <ul>
                        <li :class="{'text-decoration-line-through': entry.checked }" v-for="entry in this.listEntry.sub_entries">
                            {{entry.title}}
                        </li>
                    </ul>
                </div>
            </template>


            <v-card>
                <v-text-field cols="4" class="mx-2 mt-2" v-model="listEntry.title"></v-text-field>
                <v-divider class="mb-2"/>
                <v-container>
                    <v-row v-for="(subEntry, index) in this.listEntry.sub_entries">
                        <v-col cols="1">
                            <v-checkbox-btn cols="1" v-model="listEntry.sub_entries[index].checked"/>
                        </v-col>
                        <v-text-field cols="4" class="mr-5 ml-5" v-model="listEntry.sub_entries[index].title"></v-text-field>
                        <v-btn @click="removeFromList(index as number)" color="red" class="mt-2 mr-2" icon="mdi-close-circle-outline"></v-btn>
                    </v-row>
                    <v-row class="ms-auto mr-0">
                        <v-btn style="width: 100%" @click="addEmptyToList" color="green"><v-icon>mdi-plus-circle-outline</v-icon></v-btn>
                    </v-row>
                </v-container>
            </v-card>


            <v-card>
                <v-card-actions>
                    <v-btn color="primary" block @click="dialog = false">Fertig mit eintragen</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>

</style>