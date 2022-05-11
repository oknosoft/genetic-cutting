/**
 * Типы заддных запроса и ответа
 *
 * Created by Evgeniy Malyarov on 11.05.2022.
 */

interface Params {
    param: string;
    value: any;
}

interface Stat {
    param: string;
    value: any;
}

interface ProductRow {
    id: string;
    len: number;
    width: number;
}

interface CutRow {
    id: string;
    len: number;
    width: number;
}

interface RequestBody {
    ref: uuid;                      // Идентификатор задания. Если не задан, присваивается автоматически
    params: Params;                 // Параметры раскроя (ширина пилы, типовые размеры заготовок и т.д.)
    products: Array<ProductRow>;    // Список изделий с размерами, которые надо получить
    cuts: Array<CutRow>;            // Список заготовок и деловой обрези (из чего кроить)
}

interface ResponseBody {
    ref: uuid;                      // Идентификатор задания
    stat: Stat;                     // Статистика текущего шага или задания в целом
    products: Array<ProductRow>;    // Результат раскроя (на какую заготоку положить какое изделие)
    cuts: Array<CutRow>;            // Результат раскроя (использованная и вновь образовавшаяся деловая обрезь)
}

