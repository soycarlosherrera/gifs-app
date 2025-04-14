import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type { GiphyResponse } from '../interfaces/giphy.interfaces';
import { environment } from '@environments/environment';
import type { Gif } from '../interfaces/gif.interface';
import { GifMapper } from '../mapper/gif.mapper';
import { map, Observable, tap } from 'rxjs';


// {
//   'Goku':[gif1,gif2,gif3],
//   'Kacaroto':[gif1,gif2,gif3],
//   'Bulma':[gif1,gif2,gif3],
// }

// Record<string,Gif[]>

const GIF_KEY = 'gifs';

const loadFromLocalStorage = ():Record<string, Gif[]> => {
  //const gifs = localStorage.getItem(GIF_KEY);
  //return history ? JSON.parse(history) : {};
  const gifsFromLocalStorage = localStorage.getItem(GIF_KEY) ?? '{}';
  const gifs = JSON.parse(gifsFromLocalStorage);
  return gifs;
}


@Injectable({providedIn: 'root'})
export class GifService {

  private http = inject(HttpClient);

  trendingGifs = signal<Gif[]>([]);
  trendingGifsLoading = signal(true);


  // [ [gif,gif,gif,], [gif,gif,gif,],[gif,gif,gif,],[gif,gif,gif,] ]
  trendingGifGroup = computed<Gif[][]>(() => {
    const groups = [];
    for (let i = 0; i < this.trendingGifs().length; i += 3) {
      groups.push(this.trendingGifs().slice(i, i + 3));
    }

    return groups; //[ [g1,g2,g3],[g4,g5]]
  });

  searchHistory = signal<Record<string,Gif[]>>(loadFromLocalStorage());
  searchHistoryKeys = computed(() => Object.keys(this.searchHistory()));

  constructor() {
    this.loadTrendingGifs();
    //console.log('Servicio creado');
   }

  saveGifsToLocalStorage = effect(()=>{
    //localStorage.setItem('history',JSON.stringify(this.searchHistory()));
    const historyString = JSON.stringify(this.searchHistory());
    localStorage.setItem(GIF_KEY, historyString);
  });

   loadTrendingGifs(){
    this.http.get<GiphyResponse>(`${environment.giphyUrl}/gifs/trending`,{
      params: {
        api_key: environment.giphyApiKey,
        limit: 20,
      },
    })
    .subscribe((resp)=>{
      const gifs = GifMapper.mapGiphyItemsToGifArray(resp.data);
      this.trendingGifs.set(gifs);
      this.trendingGifsLoading.set(false);
      //console.log({gifs});
    });
   }

   searchGifs(query: string): Observable<Gif[]>{
    return this.http
    .get<GiphyResponse>(`${environment.giphyUrl}/gifs/search`,{
      params: {
        api_key: environment.giphyApiKey,
        limit: 20,
        q: query,
      },
    })
    //;
    // .subscribe((resp)=>{
    //   const gifs = GifMapper.mapGiphyItemsToGiArray(resp.data);
    //   console.log({gifs});
    // });
    .pipe(
      map(({data})=>data),
      map((items) => GifMapper.mapGiphyItemsToGifArray(items)),

      //Historial

      tap((items)=>{
        this.searchHistory.update((history) => ({
          ...history,[query.toLowerCase()]: items,
        }));
      })

    );

   }

   getHistoryGifs(query: string):Gif[]{
    return this.searchHistory()[query] ?? [];
   }

}
