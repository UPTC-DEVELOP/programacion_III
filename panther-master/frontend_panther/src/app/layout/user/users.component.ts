import { Component } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { AppService } from '../../app.service';
import {User} from '../../entities/user';

@Component({
    templateUrl: './users.component.html',
    animations: [routerTransition()]
})
export class UsersComponent {
    public users: User[];
    public data: User;
    public editUser: boolean;

    constructor(
        private _PHService: AppService
    ) {
        this.initTable();
    }

    initTable() {
        this._PHService.getUsers().subscribe(data => this.users = data);
    }

    edit(data) {
        this.data = data;
        this.editUser = true;
    }

    save() {
        this.editUser = false;
        if ( this.data.id ) {
            this._PHService.editUser(this.data,this.data.id);
        } else { this._PHService.createUser(this.data); }
        this.initTable();
    }

    delete(id) {
        this._PHService.deleteUser(id);
    }

    create() {
        this.editUser = true;
        this.data = new User();
    }
    back() {
        this.editUser = false;
    }
}
