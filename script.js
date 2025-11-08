 // Проверяем загрузку данных
    if (!window.airports || !Array.isArray(window.airports)) {
      console.error("Airports data not loaded or invalid format");
      return;
    }

    // Главный контроллер для управления состоянием
    const TransportController = {
      currentType: "Самолетом",

      init: function () {
        this.bindEvents();
        this.updateAllPlaceholders();
        this.initAllAutocompletes();
        this.syncRadioButtons();
        this.changeBackground(); // Добавляем вызов при инициализации
      },

      bindEvents: function () {
        // Обработчик для всех радиокнопок, включая модальные окна
        $(document).on(
          "change",
          'input[name="vybor_varianta_perevozki"]',
          (e) => {
            this.currentType = $(e.target).val();
            this.syncRadioButtons();
            this.updateAllPlaceholders();
            this.clearAllInputs();
            this.changeBackground(); // Добавляем вызов при изменении
          }
        );
      },

      syncRadioButtons: function () {
        $('input[name="vybor_varianta_perevozki"]').val([this.currentType]);
      },

      changeBackground: function () {
        $(".form-bg").removeClass("form-bg1 form-bg2");

        if ($("#edit-vybor-varianta-perevozki-").is(":checked")) {
          $(".form-bg").addClass("form-bg1");
        } else if ($("#edit-vybor-varianta-perevozki---2").is(":checked")) {
          $(".form-bg").addClass("form-bg2");
        }
      },

      updateAllPlaceholders: function () {
        const isAirplane = this.currentType === "Самолетом";
        const departureText = isAirplane
          ? "Аэропорт отправления"
          : "Город отправления";
        const arrivalText = isAirplane
          ? "Аэропорт назначения"
          : "Город назначения";

        $(
          ".form-item-aeroport-otpravleniya input, .ui-dialog .form-item-aeroport-otpravleniya input"
        ).attr("placeholder", departureText);

        $(
          ".form-item-aeroport-naznacheniya input, .ui-dialog .form-item-aeroport-naznacheniya input"
        ).attr("placeholder", arrivalText);
      },

      clearAllInputs: function () {
        $(
          ".form-item-aeroport-otpravleniya input, .ui-dialog .form-item-aeroport-otpravleniya input"
        )
          .val("")
          .trigger("input");

        $(
          ".form-item-aeroport-naznacheniya input, .ui-dialog .form-item-aeroport-naznacheniya input"
        )
          .val("")
          .trigger("input");
      },

      initAllAutocompletes: function () {
        $(
          ".form-item-aeroport-otpravleniya input, .form-item-aeroport-naznacheniya input, " +
            ".ui-dialog .form-item-aeroport-otpravleniya input, .ui-dialog .form-item-aeroport-naznacheniya input"
        ).each((index, element) => {
          const $input = $(element);
          if (!$input.data("autocomplete-init")) {
            this.initAutocomplete($input);
          }
        });
      },

      initAutocomplete: function ($input) {
        const $container = $input.closest(".js-form-item");
        const $list = $('<div class="autocomplete-items">')
          .insertAfter($input)
          .hide();

        const search = (term) => {
          term = term.toLowerCase().trim();
          $list.empty().hide();

          if (term.length < 2) return;

          const searchType =
            this.currentType === "Самолетом"
              ? ["airport", "country", "city"]
              : ["city", "country"];

          // Собираем уникальные результаты
          const uniqueResults = {};
          const results = window.airports
            .filter((item) => {
              if (!searchType.includes(item.type)) return false;
              if (!item.name_ru) return false;

              const nameMatch = item.name_ru.toLowerCase().includes(term);
              const iataMatch = item.iata && item.iata.toLowerCase() === term;
              return nameMatch || iataMatch;
            })
            // Фильтруем дубликаты по названию
            .filter((item) => {
              const key = item.name_ru.toLowerCase();
              if (!uniqueResults[key]) {
                uniqueResults[key] = true;
                return true;
              }
              return false;
            })
            .slice(0, 10);

          if (results.length) {
            const fragment = document.createDocumentFragment();
            results.forEach((item) => {
              const displayText =
                item.name_ru + (item.iata ? ` (${item.iata})` : "");
              const valueToSet = item.iata
                ? `${item.name_ru} (${item.iata})`
                : item.name_ru;

              $("<div>")
                .addClass("autocomplete-item")
                .text(displayText)
                .appendTo(fragment)
                .on("click", () => {
                  $input.val(valueToSet).trigger("change");
                  $list.hide();
                });
            });
            $list.append(fragment).show();
          }
        };

        let timeout;
        const debouncedSearch = (term) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => search(term), 300);
        };

        $input
          .on("input focus", () => debouncedSearch($input.val()))
          .on("blur", () => setTimeout(() => $list.hide(), 200));

        $(document).on("click", (e) => {
          if (
            !$container.is(e.target) &&
            $container.has(e.target).length === 0
          ) {
            $list.hide();
          }
        });

        $input.data("autocomplete-init", true);
      },

      initModal: function () {
        setTimeout(() => {
          this.initAllAutocompletes();
          this.updateAllPlaceholders();
          this.syncRadioButtons();
          this.changeBackground(); // Добавляем вызов для модального окна
        }, 100);
      },
    };

    // Инициализация при загрузке
    $(document).ready(() => {
      TransportController.init();

      // Определяем начальное состояние
      const initialType = $(
        'input[name="vybor_varianta_perevozki"]:checked'
      ).val();
      if (initialType) {
        TransportController.currentType = initialType;
        TransportController.syncRadioButtons();
        TransportController.changeBackground(); // Обновляем фон при инициализации
      }
    });

    // Обработчики для модальных окон
    $(document)
      .on("click", ".modal-rasschet", () => TransportController.initModal())
      .on("dialogopen", () => TransportController.initModal())
      .on("ajaxComplete", () => TransportController.initModal());
