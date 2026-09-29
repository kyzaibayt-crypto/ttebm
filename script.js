// =====================================================
// SMARTBIN — SCRIPT.JS
// Мусорки из Baserow + пользователь из Baserow
// =====================================================


// =====================================================
// BASEROW
// =====================================================

// API Token Baserow
const BASEROW_TOKEN = "RTLOkfbJYo8qTag5IMS9RzDjLDl8r1Fy";

// Таблица мусорок
const BINS_TABLE_ID = "1216642";

// Таблица пользователей
const USERS_TABLE_ID = "1218099";

// Базовый адрес API
const BASEROW_API =
    "https://api.baserow.io/api/database/rows/table/";


// =====================================================
// ФУНКЦИЯ ЗАПРОСА К BASEROW
// =====================================================

async function getBaserowData(tableId, endpoint = "") {

    const url =
        `${BASEROW_API}${tableId}/${endpoint}`;

    const separator =
        endpoint.includes("?") ? "&" : "?";

    const response = await fetch(
        `${url}${separator}user_field_names=true`,
        {
            method: "GET",

            headers: {
                "Authorization":
                    `Token ${BASEROW_TOKEN}`,

                "Content-Type":
                    "application/json"
            }
        }
    );

    if (!response.ok) {

        throw new Error(
            `Baserow error: ${response.status}`
        );
    }

    return await response.json();
}


// =====================================================
// ДАННЫЕ МУСОРОК
// =====================================================

let bins = [];


// =====================================================
// ЗАГРУЗКА МУСОРОК ИЗ BASEROW
// =====================================================

async function loadBins() {

    const container =
        document.getElementById(
            "binsContainer"
        );

    if (!container) {
        console.error(
            "Не найден binsContainer в index.html"
        );

        return;
    }


    try {

        container.innerHTML = `
            <div class="loading">
                Загрузка мусорок...
            </div>
        `;


        const data =
            await getBaserowData(
                BINS_TABLE_ID
            );


        bins =
            (data.results || []).map(
                function (row) {

                    // ID
                    const id =
                        row["ID"] ??
                        row["id"] ??
                        row["Id"] ??
                        row["Название"] ??
                        row.id;


                    // Местоположение
                    const location =
                        row["Место"] ??
                        row["Местоположение"] ??
                        row["Location"] ??
                        row["location"] ??
                        "Место не указано";


                    // Заполненность
                    let fill =
                        row["Заполненность"] ??
                        row["Заполненость"] ??
                        row["Fill"] ??
                        row["fill"] ??
                        0;


                    fill =
                        Number(fill);


                    if (
                        Number.isNaN(fill)
                    ) {
                        fill = 0;
                    }


                    // Ограничиваем 0–100
                    fill =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                fill
                            )
                        );


                    // Статус
                    let status =
                        row["Статус"] ??
                        row["Status"] ??
                        row["status"] ??
                        "";


                    // Если статус не указан,
                    // рассчитываем его автоматически
                    if (!status) {

                        if (fill < 60) {

                            status =
                                "available";

                        } else if (fill < 90) {

                            status =
                                "almost";

                        } else {

                            status =
                                "full";
                        }
                    }


                    return {

                        id:
                            id ?? "—",

                        location:
                            location,

                        fill:
                            fill,

                        status:
                            normalizeStatus(status)
                    };
                }
            );


        console.log(
            "Мусорки загружены:",
            bins
        );


        showBins(bins);


    } catch (error) {

        console.error(
            "Ошибка загрузки мусорок:",
            error
        );


        container.innerHTML = `
            <div class="error-message">

                ❌ Не удалось загрузить данные мусорок.

                <br><br>

                Проверь API Token и ID таблицы Baserow.

            </div>
        `;
    }
}


// =====================================================
// ПРИВЕДЕНИЕ СТАТУСА К НОРМАЛЬНОМУ ВИДУ
// =====================================================

function normalizeStatus(status) {

    const value =
        String(status)
            .trim()
            .toLowerCase();


    if (
        value === "available" ||
        value === "можно выбрасывать"
    ) {
        return "available";
    }


    if (
        value === "almost" ||
        value === "почти заполнена"
    ) {
        return "almost";
    }


    if (
        value === "full" ||
        value === "заполнена"
    ) {
        return "full";
    }


    return "available";
}


// =====================================================
// ТЕКСТ СТАТУСА
// =====================================================

function getStatusText(status) {

    if (status === "available") {

        return "🟢 Можно выбрасывать";
    }


    if (status === "almost") {

        return "🟡 Почти заполнена";
    }


    if (status === "full") {

        return "🔴 Заполнена";
    }


    return "⚪ Неизвестно";
}


// =====================================================
// КЛАСС ПРОГРЕСС-БАРА
// =====================================================

function getProgressClass(status) {

    if (status === "available") {

        return "progress-green";
    }


    if (status === "almost") {

        return "progress-yellow";
    }


    if (status === "full") {

        return "progress-red";
    }


    return "";
}


// =====================================================
// ПОКАЗ МУСОРОК
// =====================================================

function showBins(list) {

    const container =
        document.getElementById(
            "binsContainer"
        );


    if (!container) {

        console.error(
            "Элемент #binsContainer не найден."
        );

        return;
    }


    container.innerHTML = "";


    if (list.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                Мусорок пока нет.
            </p>
        `;

        return;
    }


    list.forEach(
        function (bin) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "bin-card";


            card.innerHTML = `

                <h3>
                    🗑️ SmartBin #${bin.id}
                </h3>

                <div class="bin-location">
                    📍 ${escapeHTML(
                        bin.location
                    )}
                </div>

                <div class="bin-progress">

                    <div
                        class="
                            bin-progress-fill
                            ${getProgressClass(
                                bin.status
                            )}
                        "
                        style="
                            width: ${bin.fill}%
                        "
                    ></div>

                </div>

                <div class="bin-bottom">

                    <span class="fill-value">

                        Заполненность:
                        ${bin.fill}%

                    </span>

                    <span class="status">

                        ${getStatusText(
                            bin.status
                        )}

                    </span>

                </div>

            `;


            container.appendChild(
                card
            );
        }
    );
}


// =====================================================
// ЗАЩИТА ТЕКСТА
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =====================================================
// ФИЛЬТРЫ
// =====================================================

const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );


filterButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );
                    }
                );


                button.classList.add(
                    "active"
                );


                const status =
                    button.dataset.status;


                if (
                    status === "all"
                ) {

                    showBins(bins);

                    return;
                }


                const filtered =
                    bins.filter(
                        function (bin) {

                            return (
                                bin.status ===
                                status
                            );
                        }
                    );


                showBins(
                    filtered
                );
            }
        );
    }
);


// =====================================================
// ПОЛЬЗОВАТЕЛЬ
// =====================================================

async function loadCurrentUser() {

    const loggedIn =
        localStorage.getItem(
            "smartbin_logged_in"
        );


    const userId =
        localStorage.getItem(
            "smartbin_user_id"
        );


    // Пользователь не вошёл
    if (
        loggedIn !== "true" ||
        !userId
    ) {

        return;
    }


    try {

        const user =
            await getBaserowData(
                USERS_TABLE_ID,
                `${userId}/`
            );


        console.log(
            "Пользователь из Baserow:",
            user
        );


        // Имя
        const username =
            user["user"] ??
            user["username"] ??
            user["Имя"] ??
            user["Имя пользователя"] ??
            "Пользователь";


        // Email
        const email =
            user["email"] ??
            user["Email"] ??
            "";


        // Обновляем сохранённые данные
        localStorage.setItem(
            "smartbin_username",
            username
        );


        localStorage.setItem(
            "smartbin_email",
            email
        );


        // =================================================
        // ПЕРЕДАЁМ ДАННЫЕ В INDEX.HTML
        // =================================================

        const accountName =
            document.getElementById(
                "accountName"
            );


        const dropdownName =
            document.getElementById(
                "dropdownName"
            );


        const dropdownEmail =
            document.getElementById(
                "dropdownEmail"
            );


        if (accountName) {

            accountName.textContent =
                username;
        }


        if (dropdownName) {

            dropdownName.textContent =
                username;
        }


        if (dropdownEmail) {

            dropdownEmail.textContent =
                email ||
                "Email не указан";
        }


        // Показываем аккаунт
        const accountMenu =
            document.getElementById(
                "accountMenu"
            );


        const loginButton =
            document.getElementById(
                "loginButton"
            );


        if (accountMenu) {

            accountMenu.style.display =
                "block";
        }


        if (loginButton) {

            loginButton.style.display =
                "none";
        }


    } catch (error) {

        console.error(
            "Ошибка загрузки пользователя:",
            error
        );
    }
}


// =====================================================
// ЗАПУСК
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Загружаем мусорки
        loadBins();

        // Загружаем пользователя
        loadCurrentUser();

    }
);
