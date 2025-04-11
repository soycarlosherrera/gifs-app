import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import type { GiphyResponse } from '../interfaces/giphy.interfaces';
import { environment } from '@environments/environment';
import type { Gif } from '../interfaces/gif.interface';
import { GifMapper } from '../mapper/gif.mapper';
import { map, tap } from 'rxjs';


// {
//   'Goku':[gif1,gif2,gif3],
//   'Kacaroto':[gif1,gif2,gif3],
//   'Bulma':[gif1,gif2,gif3],
// }

// Record<string,Gif[]>


@Injectable({providedIn: 'root'})
export class GifService {

  private http = inject(HttpClient);

  trendingGifs = signal<Gif[]>([]);
  trendingGifsLoading = signal(true);

  searchHistory = signal<Record<string,Gif[]>>({});
  searchHistoryKeys = computed(() => Object.keys(this.searchHistory()));

  constructor() {
    this.loadTrendingGifs();
    console.log('Servicio creado');
   }

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
      console.log({gifs});
    });
   }

   searchGifs(query: string){
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

}
