import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './entities/user';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'authorization': '750e8b43e5ed564462c90ef0d382db26'
    })
};


@Injectable()
export class AppService {
    private _base = 'http://localhost/j4panther/rest/';
    private _urlUser = `${this._base}persons/`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this._urlUser, httpOptions);
  }

  getUserId(id): Observable<User[]> {
    return this.http.get<User[]>(`${this._urlUser}${id}`);
  }

  editUser(data,id) {	 
    this.http.put<User[]>(`${this._urlUser}${id}`, data, httpOptions).subscribe(
      () => {});
  }

  createUser(data) {
    this.http.post<User[]>(`${this._urlUser}`, data, httpOptions).subscribe(
        () => { this.router.navigate(['/user-show']); },
    );
  }

  deleteUser(id) {
    this.http.delete(`${this._urlUser}${id}`, httpOptions).subscribe(
      () => {
        window.location.reload();
      });
  }

}
